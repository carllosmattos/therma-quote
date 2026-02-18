import type { Proposal, ProposalLineItem } from '../domain/proposal'
import type { ProposalComplianceSummary } from '../domain/compliance'
import type { QueryExecResult } from 'sql.js'
import { getDatabase, persistDatabase, execSql, selectSql } from '../../shared/infrastructure/sqliteDb'
import { getProposalComplianceSummary } from './complianceStorage'

function mapRows<T>(result: QueryExecResult[], mapper: (record: Record<string, unknown>) => T): T[] {
  if (result.length === 0) {
    return []
  }

  const { columns, values } = result[0] as { columns: string[]; values: unknown[][] }
  return values.map((row: unknown[]) => {
    const record: Record<string, unknown> = {}
    columns.forEach((column: string, index: number) => {
      record[column] = row[index]
    })
    return mapper(record)
  })
}

function parseScopes(value: unknown): ProposalLineItem['additionalScopes'] {
  if (!value) {
    return []
  }

  try {
    return JSON.parse(String(value)) as ProposalLineItem['additionalScopes']
  } catch {
    return []
  }
}

function parseComplianceSummary(value: unknown, proposalId: string): ProposalComplianceSummary {
  if (value) {
    try {
      return JSON.parse(String(value)) as ProposalComplianceSummary
    } catch {
      return getProposalComplianceSummary(proposalId)
    }
  }

  return getProposalComplianceSummary(proposalId)
}

function listLineItems(proposalId: string): ProposalLineItem[] {
  const db = getDatabase()
  const results = selectSql(db, 'SELECT * FROM proposal_line_items WHERE proposal_id = ?', [proposalId])

  return results.map((record: Record<string, unknown>) => ({
    id: String(record.id),
    serviceArea: String(record.service_area) as ProposalLineItem['serviceArea'],
    application: String(record.application) as ProposalLineItem['application'],
    materialKey: String(record.material_key) as ProposalLineItem['materialKey'],
    materialName: String(record.material_name),
    materialRValuePerInch: Number(record.material_r_value_per_inch),
    targetRValue: Number(record.target_r_value),
    existingRValue: Number(record.existing_r_value),
    rValueToInstall: Number(record.r_value_to_install),
    depthInches: Number(record.depth_inches),
    areaSqFt: Number(record.area_sq_ft),
    wasteFactorPct: Number(record.waste_factor_pct),
    effectiveAreaSqFt: Number(record.effective_area_sq_ft),
    materialCostPerSqFt: Number(record.material_cost_per_sq_ft),
    laborCostPerSqFt: Number(record.labor_cost_per_sq_ft),
    coverageFactor: Number(record.coverage_factor),
    materialQuantity: Number(record.material_quantity),
    materialUnit: String(record.material_unit),
    mobilizationCost: Number(record.mobilization_cost),
    additionalScopes: parseScopes(record.additional_scopes_json),
    additionalScopesTotal: Number(record.additional_scopes_total),
    subtotal: Number(record.subtotal),
    marginRate: Number(record.margin_rate),
    marginValue: Number(record.margin_value),
    suggestedTotal: Number(record.suggested_total),
    finalTotal: Number(record.final_total),
    note: String(record.note ?? ''),
    taxCredit: Number(record.tax_credit),
    taxCreditMax: Number(record.tax_credit_max),
    taxCreditPercentage: Number(record.tax_credit_percentage),
    estimatedAnnualSavings: record.estimated_annual_savings ? Number(record.estimated_annual_savings) : undefined,
    estimatedMonthlyAverage: record.estimated_monthly_average ? Number(record.estimated_monthly_average) : undefined,
    paybackPeriod: record.payback_period ? Number(record.payback_period) : undefined,
    energyPercentReduction: record.energy_percent_reduction ? String(record.energy_percent_reduction) : undefined,
  }))
}

function mapProposal(record: Record<string, unknown>): Proposal {
  const proposalId = String(record.id)
  return {
    id: proposalId,
    contractorId: String(record.contractor_id),
    companyId: String(record.company_id),
    clientId: String(record.client_id),
    climateZone: Number(record.climate_zone),
    status: String(record.status) as Proposal['status'],
    subtotal: Number(record.subtotal),
    suggestedTotal: Number(record.suggested_total),
    taxCredit: Number(record.tax_credit),
    netPrice: Number(record.net_price),
    finalTotal: Number(record.final_total),
    createdAt: String(record.created_at),
    updatedAt: String(record.updated_at),
    lineItems: listLineItems(proposalId),
    note: String(record.note ?? ''),
    deletedAt: record.deleted_at ? String(record.deleted_at) : undefined,
    totalEstimatedAnnualSavings: record.total_estimated_annual_savings
      ? Number(record.total_estimated_annual_savings)
      : undefined,
    totalEstimatedMonthlyAverage: record.total_estimated_monthly_average
      ? Number(record.total_estimated_monthly_average)
      : undefined,
    recommendedPaybackPeriod: record.recommended_payback_period ? Number(record.recommended_payback_period) : undefined,
    pricingTier: record.pricing_tier ? (String(record.pricing_tier) as Proposal['pricingTier']) : undefined,
    complianceSummary: parseComplianceSummary(record.compliance_summary_json, proposalId),
  }
}

export function listContractorProposals(contractorId: string): Proposal[] {
  const db = getDatabase()
  const result = db.exec(
    'SELECT * FROM proposals WHERE contractor_id = ? AND deleted_at IS NULL ORDER BY updated_at DESC',
    [contractorId],
  )

  return mapRows(result, mapProposal)
}

export function getProposal(proposalId: string): Proposal | null {
  const db = getDatabase()
  const results = selectSql(db, 'SELECT * FROM proposals WHERE id = ? AND deleted_at IS NULL', [proposalId])

  const proposals = results.map((record: Record<string, unknown>) => mapProposal(record))
  return proposals[0] ?? null
}

export function deleteProposal(proposalId: string): void {
  const db = getDatabase()
  execSql(db, 'UPDATE proposals SET deleted_at = ? WHERE id = ?', [new Date().toISOString(), proposalId])
  persistDatabase()
}

export function upsertProposal(nextProposal: Proposal): void {
  const db = getDatabase()
  const complianceSummaryJson = nextProposal.complianceSummary ? JSON.stringify(nextProposal.complianceSummary) : null

  // Insert or replace the proposal (no explicit transactions - sql.js doesn't handle nested transactions well)
  execSql(
    db,
    `INSERT OR REPLACE INTO proposals (
      id, contractor_id, company_id, client_id, climate_zone, status, subtotal, suggested_total,
      tax_credit, net_price, final_total, created_at, updated_at, note, deleted_at,
      total_estimated_annual_savings, total_estimated_monthly_average, recommended_payback_period,
      pricing_tier, compliance_summary_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nextProposal.id,
      nextProposal.contractorId,
      nextProposal.companyId,
      nextProposal.clientId,
      nextProposal.climateZone,
      nextProposal.status,
      nextProposal.subtotal,
      nextProposal.suggestedTotal,
      nextProposal.taxCredit,
      nextProposal.netPrice,
      nextProposal.finalTotal,
      nextProposal.createdAt,
      nextProposal.updatedAt,
      nextProposal.note ?? '',
      nextProposal.deletedAt ?? null,
      nextProposal.totalEstimatedAnnualSavings ?? null,
      nextProposal.totalEstimatedMonthlyAverage ?? null,
      nextProposal.recommendedPaybackPeriod ?? null,
      nextProposal.pricingTier ?? null,
      complianceSummaryJson,
    ]
  )

  // Delete old line items
  execSql(db, 'DELETE FROM proposal_line_items WHERE proposal_id = ?', [nextProposal.id])

  // Insert new line items
  nextProposal.lineItems.forEach((item) => {
    const scopesJson = JSON.stringify(item.additionalScopes ?? [])
    execSql(
      db,
      `INSERT OR REPLACE INTO proposal_line_items (
        id, proposal_id, service_area, application, material_key, material_name, material_r_value_per_inch,
        target_r_value, existing_r_value, r_value_to_install, depth_inches, area_sq_ft, waste_factor_pct,
        effective_area_sq_ft, material_cost_per_sq_ft, labor_cost_per_sq_ft, coverage_factor, material_quantity,
        material_unit, mobilization_cost, additional_scopes_json, additional_scopes_total, subtotal, margin_rate,
        margin_value, suggested_total, final_total, note, tax_credit, tax_credit_max, tax_credit_percentage,
        estimated_annual_savings, estimated_monthly_average, payback_period, energy_percent_reduction
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        nextProposal.id,
        item.serviceArea,
        item.application,
        item.materialKey,
        item.materialName,
        item.materialRValuePerInch,
        item.targetRValue,
        item.existingRValue,
        item.rValueToInstall,
        item.depthInches,
        item.areaSqFt,
        item.wasteFactorPct,
        item.effectiveAreaSqFt,
        item.materialCostPerSqFt,
        item.laborCostPerSqFt,
        item.coverageFactor,
        item.materialQuantity,
        item.materialUnit,
        item.mobilizationCost,
        scopesJson,
        item.additionalScopesTotal,
        item.subtotal,
        item.marginRate,
        item.marginValue,
        item.suggestedTotal,
        item.finalTotal,
        item.note ?? '',
        item.taxCredit,
        item.taxCreditMax,
        item.taxCreditPercentage,
        item.estimatedAnnualSavings ?? null,
        item.estimatedMonthlyAverage ?? null,
        item.paybackPeriod ?? null,
        item.energyPercentReduction ?? null,
      ]
    )
  })

  persistDatabase()
}
