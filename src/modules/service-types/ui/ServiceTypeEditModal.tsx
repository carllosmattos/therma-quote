import { useState } from 'react'
import type { ServiceType } from '../domain/serviceType'

interface ServiceTypeEditModalProps {
  serviceType: ServiceType
  onSave: (serviceTypeData: Partial<Omit<ServiceType, 'id' | 'deletedAt'>>) => void
  onCancel: () => void
}

function parseNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ServiceTypeEditModal(props: ServiceTypeEditModalProps) {
  const [name, setName] = useState(props.serviceType.name)
  const [material, setMaterial] = useState(props.serviceType.defaultMaterialCostPerSqFt)
  const [labor, setLabor] = useState(props.serviceType.defaultLaborCostPerSqFt)
  const [supportsRValue, setSupportsRValue] = useState(props.serviceType.supportsRValue)
  const [targetRValue, setTargetRValue] = useState(props.serviceType.defaultTargetRValue ?? 13)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    props.onSave({
      name,
      defaultMaterialCostPerSqFt: material,
      defaultLaborCostPerSqFt: labor,
      supportsRValue,
      defaultTargetRValue: supportsRValue ? targetRValue : undefined,
    })
  }

  return (
    <div className="modal-overlay" onClick={props.onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Service Type</h2>
          <button type="button" className="modal-close" onClick={props.onCancel}>
            ×
          </button>
        </div>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Service name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="Attic Insulation"
              title="Name of the insulation service"
            />
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
              title="Material cost per square foot"
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
              title="Labor cost per square foot"
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
                title="Default target R-value for this service"
              />
            </label>
          ) : null}
          <div className="form-submit-row" style={{ gridColumn: '1 / -1' }}>
            <button className="secondary-action" type="button" onClick={props.onCancel}>
              Cancel
            </button>
            <button className="primary-action" type="submit">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
