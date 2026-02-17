import { useState } from 'react'
import { useAuth } from '../../auth/application/useAuth'
import { useContractorServiceTypes } from '../application/useContractorServiceTypes'
import { ServiceTypeEditModal } from './ServiceTypeEditModal'
import type { ServiceType } from '../domain/serviceType'

function parseNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ServiceTypesPage() {
  const { user } = useAuth()
  const { serviceTypes, addServiceType, updateServiceType, deleteServiceType } = useContractorServiceTypes(
    user?.id ?? 'no-contractor',
  )

  const [name, setName] = useState('')
  const [material, setMaterial] = useState(1.85)
  const [labor, setLabor] = useState(1.25)
  const [supportsRValue, setSupportsRValue] = useState(false)
  const [targetRValue, setTargetRValue] = useState(13)
  const [editingServiceType, setEditingServiceType] = useState<ServiceType | null>(null)

  if (!user) {
    return null
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    addServiceType({
      name,
      defaultMaterialCostPerSqFt: material,
      defaultLaborCostPerSqFt: labor,
      supportsRValue,
      defaultTargetRValue: supportsRValue ? targetRValue : undefined,
    })

    setName('')
    setMaterial(1.85)
    setLabor(1.25)
    setSupportsRValue(false)
    setTargetRValue(13)
  }

  function handleEdit(serviceType: ServiceType) {
    setEditingServiceType(serviceType)
  }

  function handleSaveEdit(serviceTypeData: Partial<Omit<ServiceType, 'id' | 'deletedAt'>>) {
    if (editingServiceType) {
      updateServiceType(editingServiceType.id, serviceTypeData)
      setEditingServiceType(null)
    }
  }

  function handleDelete(serviceTypeId: string, serviceTypeName: string) {
    if (window.confirm(`Are you sure you want to delete service type "${serviceTypeName}"? This action cannot be undone.`)) {
      deleteServiceType(serviceTypeId)
    }
  }

  return (
    <main className="dashboard">
      <section className="panel">
        <h1>Insulation Services</h1>
        <p className="subtitle">Register service templates used in proposal search.</p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Service name
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            Material ($/sq ft)
            <input
              type="number"
              min={0}
              step="0.01"
              value={material}
              onChange={(event) => setMaterial(parseNumber(event.target.value))}
              required
            />
          </label>
          <label>
            Labor ($/sq ft)
            <input
              type="number"
              min={0}
              step="0.01"
              value={labor}
              onChange={(event) => setLabor(parseNumber(event.target.value))}
              required
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={supportsRValue} onChange={(event) => setSupportsRValue(event.target.checked)} />
            Supports R-value (spray foam)
          </label>
          {supportsRValue ? (
            <label>
              Default target R-value
              <input
                type="number"
                min={1}
                step="1"
                value={targetRValue}
                onChange={(event) => setTargetRValue(parseNumber(event.target.value))}
              />
            </label>
          ) : null}
          <div className="form-submit-row">
            <button className="primary-action" type="submit">
              Add Service
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Service Base</h2>
        <div className="list-grid">
          {serviceTypes.map((service) => (
            <article className="list-item" key={service.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong>{service.name}</strong>
                  <span>Material: ${service.defaultMaterialCostPerSqFt.toFixed(2)}/sq ft</span>
                  <span>Labor: ${service.defaultLaborCostPerSqFt.toFixed(2)}/sq ft</span>
                  <span>
                    {service.supportsRValue ? `R-value default: ${service.defaultTargetRValue ?? 13}` : 'No R-value input'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                  <button type="button" className="secondary-action" onClick={() => handleEdit(service)}>
                    Edit
                  </button>
                  <button type="button" className="secondary-action" onClick={() => handleDelete(service.id, service.name)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editingServiceType && (
        <ServiceTypeEditModal serviceType={editingServiceType} onSave={handleSaveEdit} onCancel={() => setEditingServiceType(null)} />
      )}
    </main>
  )
}
