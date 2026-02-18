import type { ServiceType } from '../domain/serviceType'
import { serviceTypes as defaultServiceTypes } from '../../../data/seedData'
import { getDatabase, persistDatabase, selectSql, execSql } from '../../shared/infrastructure/sqliteDb'

function ensureSeed(contractorId: string): void {
  const db = getDatabase()
  const countResults = selectSql(db, 'SELECT COUNT(*) as count FROM service_types WHERE contractor_id = ?', [contractorId])
  const count = countResults.length > 0 ? Number(countResults[0].count) : 0

  if (count > 0) {
    return
  }

  defaultServiceTypes.forEach((serviceType) => {
    execSql(
      db,
      `INSERT OR IGNORE INTO service_types (
        id, contractor_id, name, model, default_material_cost_per_sq_ft, default_labor_cost_per_sq_ft,
        supports_r_value, default_target_r_value, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        serviceType.id,
        contractorId,
        serviceType.name,
        serviceType.model,
        serviceType.defaultMaterialCostPerSqFt,
        serviceType.defaultLaborCostPerSqFt,
        serviceType.supportsRValue ? 1 : 0,
        serviceType.defaultTargetRValue ?? null,
        serviceType.deletedAt ?? null,
      ]
    )
  })

  persistDatabase()
}

export function listContractorServiceTypes(contractorId: string): ServiceType[] {
  ensureSeed(contractorId)
  const db = getDatabase()
  const results = selectSql(
    db,
    'SELECT * FROM service_types WHERE contractor_id = ? AND deleted_at IS NULL ORDER BY name',
    [contractorId]
  )

  if (results.length === 0) {
    return []
  }

  return results.map((record: Record<string, unknown>) => {
    return {
      id: String(record.id),
      name: String(record.name),
      model: String(record.model) as ServiceType['model'],
      defaultMaterialCostPerSqFt: Number(record.default_material_cost_per_sq_ft),
      defaultLaborCostPerSqFt: Number(record.default_labor_cost_per_sq_ft),
      supportsRValue: Boolean(record.supports_r_value),
      defaultTargetRValue: record.default_target_r_value ? Number(record.default_target_r_value) : undefined,
      deletedAt: record.deleted_at ? String(record.deleted_at) : undefined,
    }
  })
}

export function addContractorServiceType(contractorId: string, input: Omit<ServiceType, 'id'>): ServiceType {
  ensureSeed(contractorId)
  const db = getDatabase()
  const nextServiceType: ServiceType = {
    id: `svc-${Date.now()}`,
    ...input,
  }

  try {
    execSql(
      db,
      `INSERT INTO service_types (
        id, contractor_id, name, model, default_material_cost_per_sq_ft, default_labor_cost_per_sq_ft,
        supports_r_value, default_target_r_value, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextServiceType.id,
        contractorId,
        nextServiceType.name,
        nextServiceType.model,
        nextServiceType.defaultMaterialCostPerSqFt,
        nextServiceType.defaultLaborCostPerSqFt,
        nextServiceType.supportsRValue ? 1 : 0,
        nextServiceType.defaultTargetRValue ?? null,
        nextServiceType.deletedAt ?? null,
      ]
    )
    persistDatabase()
    
  } catch (err) {
    console.error('[addContractorServiceType] Error adding service type:', err)
    throw err
  }
  return nextServiceType
}

export function updateContractorServiceType(
  contractorId: string,
  serviceTypeId: string,
  updates: Partial<Omit<ServiceType, 'id'>>,
): void {
  ensureSeed(contractorId)
  const db = getDatabase()

  execSql(
    db,
    `UPDATE service_types SET
      name = COALESCE(?, name),
      model = COALESCE(?, model),
      default_material_cost_per_sq_ft = COALESCE(?, default_material_cost_per_sq_ft),
      default_labor_cost_per_sq_ft = COALESCE(?, default_labor_cost_per_sq_ft),
      supports_r_value = COALESCE(?, supports_r_value),
      default_target_r_value = COALESCE(?, default_target_r_value)
     WHERE id = ? AND contractor_id = ?`,
    [
      updates.name ?? null,
      updates.model ?? null,
      updates.defaultMaterialCostPerSqFt ?? null,
      updates.defaultLaborCostPerSqFt ?? null,
      updates.supportsRValue !== undefined ? (updates.supportsRValue ? 1 : 0) : null,
      updates.defaultTargetRValue ?? null,
      serviceTypeId,
      contractorId,
    ]
  )

  persistDatabase()
}

export function deleteContractorServiceType(contractorId: string, serviceTypeId: string): void {
  ensureSeed(contractorId)
  const db = getDatabase()
  execSql(db, 'UPDATE service_types SET deleted_at = ? WHERE id = ? AND contractor_id = ?', [new Date().toISOString(), serviceTypeId, contractorId])
  persistDatabase()
}
