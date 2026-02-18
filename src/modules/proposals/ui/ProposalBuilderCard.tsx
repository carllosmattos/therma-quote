import { useState } from 'react'
import type { Client } from '../../clients/domain/client'
import type { ProposalLineItem, ProposalStatus } from '../domain/proposal'
import type { InspectionPhoto, ManufacturerCertification, PreliminaryInspection } from '../domain/compliance'
import type {
  AdditionalScopeDefinition,
  AdditionalScopeKey,
  ApplicationDefinition,
  ApplicationKey,
  ClimateZoneDefinition,
  InsulationMaterialDefinition,
  InsulationMaterialKey,
  ServiceAreaDefinition,
  ServiceAreaKey,
} from '../domain/insulationCatalog'
import { DOE_CLIMATE_ZONES, getAllowedApplicationsForMaterial, isRequiredScope } from '../domain/insulationCatalog'
import { CollapsibleSection } from './CollapsibleSection'

interface EditableLineItem extends ProposalLineItem {
  isFinalLocked: boolean
}

interface ProposalBuilderCardProps {
  status: ProposalStatus
  isReadOnly: boolean
  actionMessage: string
  clientQuery: string
  filteredClients: Client[]
  areaQuery: string
  filteredServiceAreas: ServiceAreaDefinition[]
  scopeQuery: string
  filteredScopes: AdditionalScopeDefinition[]
  climateZone: number
  climateZones?: ClimateZoneDefinition[]
  serviceAreas: ServiceAreaDefinition[]
  materials: InsulationMaterialDefinition[]
  applications: ApplicationDefinition[]
  lineItems: EditableLineItem[]
  activeLineItemId: string
  activeLineItem: EditableLineItem | undefined
  bagCountWarning?: string
  depthWarning?: string
  scopeConflictWarning?: string
  note: string
  onClientQueryChange: (value: string) => void
  onSelectClient: (value: string) => void
  onAreaQueryChange: (value: string) => void
  onScopeQueryChange: (value: string) => void
  onClimateZoneChange: (value: number) => void
  onAddServiceLine: (serviceArea: ServiceAreaKey) => void
  onSelectActiveLine: (lineItemId: string) => void
  onRemoveServiceLine: (lineItemId: string) => void
  onMaterialChange: (value: InsulationMaterialKey) => void
  onApplicationChange: (value: ApplicationKey) => void
  onRValuePerInchChange: (value: number) => void
  onAreaChange: (value: number) => void
  onWasteFactorChange: (value: number) => void
  onCoverageFactorChange: (value: number) => void
  onMobilizationCostChange: (value: number) => void
  onMaterialCostChange: (value: number) => void
  onLaborCostChange: (value: number) => void
  onMarginChange: (value: number) => void
  onTargetRValueChange: (value: number) => void
  onExistingRValueChange: (value: number) => void
  onAddScope: (scopeKey: AdditionalScopeKey) => void
  onScopeQuantityChange: (scopeKey: string, value: number) => void
  onScopeUnitPriceChange: (scopeKey: string, value: number) => void
  onRemoveScope: (scopeKey: string) => void
  onSubtotalChange: (value: number) => void
  onSuggestedTotalChange: (value: number) => void
  onFinalTotalChange: (value: number) => void
  onUseFormula: () => void
  onUseSuggestion: () => void
  onMatchSuggested: () => void
  onLineNoteChange: (value: string) => void
  onNoteChange: (value: string) => void
  inspection: PreliminaryInspection | null
  inspectionPhotos: InspectionPhoto[]
  manufacturerCertifications: ManufacturerCertification[]
  onSaveInspection: (input: {
    status: PreliminaryInspection['status']
    inspectorName: string
    inspectionDate?: string
    existingRValueValidated: boolean
    existingRValueFound: number
    accessNotes: string
    notes: string
  }) => void
  onAddInspectionPhoto: (file: File, caption?: string) => Promise<void>
  onAddManufacturerCertification: (input: Omit<ManufacturerCertification, 'id' | 'proposalId'>) => void
  onDeleteInspectionPhoto: (photoId: string, fileName: string) => Promise<void>
  onDeleteManufacturerCertification: (certificationId: string) => void
}

function parseNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function ProposalBuilderCard(props: ProposalBuilderCardProps) {
  const lineItem = props.activeLineItem

  const [isAreaSearchFocused, setIsAreaSearchFocused] = useState(false)
  const [isScopeSearchFocused, setIsScopeSearchFocused] = useState(false)

  const climateZones = props.climateZones ?? DOE_CLIMATE_ZONES
  const additionalScopes = lineItem?.additionalScopes ?? []
  const activeServiceAreaLabel = lineItem
    ? props.serviceAreas.find((item) => item.key === lineItem.serviceArea)?.label ?? lineItem.serviceArea
    : 'Select a service area to begin'
  const allowedApplications = lineItem
    ? getAllowedApplicationsForMaterial(lineItem.materialKey as InsulationMaterialKey)
    : []
  const applicationOptions = props.applications.filter((application) => allowedApplications.includes(application.key))
  const currentApplication = props.applications.find((application) => application.key === lineItem?.application)

  return (
    <section className="panel builder-panel">
      <div className="panel-header">
        <h2>Create Proposal</h2>
        <span className="status-pill">{props.status}</span>
      </div>

      {props.actionMessage ? <p className="feedback success">{props.actionMessage}</p> : null}

      {/* Section 1: Client & Job Info */}
      <CollapsibleSection title="Client & Job Info" defaultOpen={true}>
        <div className="search-grid">
          <label className="search-field">
            Search homeowner
            <input
              value={props.clientQuery}
              onChange={(event) => props.onClientQueryChange(event.target.value)}
              placeholder="Type part of the homeowner name"
              disabled={props.isReadOnly}
            />
            {!props.isReadOnly ? (
              <div className="search-results">
                {props.filteredClients.map((client) => (
                  <button key={client.id} type="button" onClick={() => props.onSelectClient(client.id)}>
                    {client.name}
                  </button>
                ))}
              </div>
            ) : null}
          </label>

          <label>
            DOE climate zone
            <select
              value={props.climateZone}
              onChange={(event) => props.onClimateZoneChange(Number(event.target.value))}
              disabled={props.isReadOnly}
              title="Department of Energy climate zone for this location"
            >
              {climateZones.map((zone) => (
                <option key={zone.zone} value={zone.zone}>
                  {zone.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </CollapsibleSection>

      {/* Section 2: Project Scope */}
      <CollapsibleSection title="Project Scope" defaultOpen={true}>
        <label className="search-field">
          Search service area
          <input
            value={props.areaQuery}
            onChange={(event) => props.onAreaQueryChange(event.target.value)}
            onFocus={() => setIsAreaSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsAreaSearchFocused(false), 200)}
            placeholder="Type to search service areas"
            disabled={props.isReadOnly}
            title="Search and select the location where insulation will be installed (attic, walls, crawl space, etc.)"
          />
          {!props.isReadOnly && (isAreaSearchFocused || props.areaQuery) ? (
            <div className="search-results">
              {props.filteredServiceAreas.map((serviceArea) => (
                <button key={serviceArea.key} type="button" onClick={() => props.onAddServiceLine(serviceArea.key)}>
                  Add {serviceArea.label}
                </button>
              ))}
            </div>
          ) : null}
        </label>

        {props.lineItems.length === 0 ? (
          <div className="panel" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>Select a service area to start</h3>
            <p className="subtitle">Use the search above to add the first scope of work for this proposal.</p>
          </div>
        ) : null}

        <div className="line-items-list" style={{ marginTop: props.lineItems.length === 0 ? 0 : '1rem' }}>
          {props.lineItems.map((item) => (
            <article className={`line-item-card ${item.id === props.activeLineItemId ? 'active' : ''}`} key={item.id}>
              <button type="button" className="line-item-select" onClick={() => props.onSelectActiveLine(item.id)}>
                <strong>{props.serviceAreas.find((area) => area.key === item.serviceArea)?.label ?? item.serviceArea}</strong>
                <span>
                  {item.areaSqFt.toLocaleString()} sq ft · {item.materialName}
                </span>
              </button>
              <button
                type="button"
                className="line-item-remove"
                disabled={props.isReadOnly}
                onClick={() => props.onRemoveServiceLine(item.id)}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      </CollapsibleSection>
      {lineItem ? (
        <>
          {/* Section 3: Insulation Details */}
          <CollapsibleSection title="Insulation Details" defaultOpen={true}>
            <div className="form-grid">
              <label>
                Material
                <select
                  value={lineItem.materialKey}
                  onChange={(event) => props.onMaterialChange(event.target.value as InsulationMaterialKey)}
                  disabled={props.isReadOnly}
                  title="Select the insulation material type - each has different R-value per inch and applications"
                >
                  {props.materials.map((material) => (
                    <option key={material.key} value={material.key}>
                      {material.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Application
                <select
                  value={lineItem.application}
                  onChange={(event) => props.onApplicationChange(event.target.value as ApplicationKey)}
                  disabled={props.isReadOnly}
                  title="Installation method - batts, blown-in, spray foam, etc. Filtered by material compatibility"
                >
                  {applicationOptions.map((application) => (
                    <option key={application.key} value={application.key}>
                      {application.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Service area (sq ft)
                <input
                  type="number"
                  min={0}
                  value={lineItem.areaSqFt}
                  onChange={(event) => props.onAreaChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly}
                  title="Total square footage of the area to be insulated"
                />
              </label>

              <label>
                Target R-value
                <input
                  type="number"
                  step="1"
                  min={1}
                  value={lineItem.targetRValue}
                  onChange={(event) => props.onTargetRValueChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly}
                  title="Desired final R-value based on DOE climate zone recommendations"
                />
              </label>

              <label>
                Existing insulation (R-value)
                <input
                  type="number"
                  step="1"
                  min={0}
                  value={lineItem.existingRValue}
                  onChange={(event) => props.onExistingRValueChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly}
                  title="Current R-value of existing insulation in this area (0 if none)"
                />
              </label>

              <label>
                R-value to install
                <input
                  type="number"
                  value={lineItem.rValueToInstall}
                  disabled
                  title="Calculated R-value needed: Target - Existing (auto-calculated)"
                />
              </label>
            </div>

            <br />
            
            {/* Nested: Advanced Settings */}
            <CollapsibleSection title="Advanced Settings" defaultOpen={false}>
              <div className="form-grid">
                <label>
                  Material R-value / inch
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={lineItem.materialRValuePerInch}
                    onChange={(event) => props.onRValuePerInchChange(parseNumber(event.target.value))}
                    disabled={props.isReadOnly}
                    title="Thermal resistance per inch of material thickness - can be edited for custom products"
                  />
                </label>

                <label>
                  Application unit
                  <input
                    type="text"
                    value={lineItem.materialUnit ?? currentApplication?.unitLabel ?? 'units'}
                    disabled
                    title="Unit of measurement for material quantity (bags, sq ft, board feet, boards)"
                  />
                </label>

                <label>
                  Waste factor (%)
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={lineItem.wasteFactorPct}
                    onChange={(event) => props.onWasteFactorChange(parseNumber(event.target.value))}
                    disabled={props.isReadOnly}
                    title="Percentage for overage due to cuts, waste, and irregularities (typical: 5-15%)"
                  />
                </label>

                <label>
                  Coverage factor
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    value={lineItem.coverageFactor}
                    onChange={(event) => props.onCoverageFactorChange(parseNumber(event.target.value))}
                    disabled={props.isReadOnly}
                    title="For blown-in: coverage in sq ft per bag at target R-value (from manufacturer specs)"
                  />
                </label>

                <label>
                  Effective area (sq ft)
                  <input
                    type="number"
                    value={lineItem.effectiveAreaSqFt}
                    disabled
                    title="Service area + waste factor = actual coverage needed (auto-calculated)"
                  />
                </label>

                <label>
                  Depth (in)
                  <input
                    type="number"
                    value={lineItem.depthInches}
                    disabled
                    title="Calculated insulation thickness: R-value to install / R-value per inch (auto-calculated)"
                  />
                </label>

                <label>
                  Estimated material ({lineItem.materialUnit})
                  <input
                    type="number"
                    value={lineItem.materialQuantity}
                    disabled
                    title="Material quantity calculated based on area, depth, and application type (auto-calculated)"
                  />
                </label>
              </div>
            </CollapsibleSection>
          </CollapsibleSection>

          {/* Section 4: Pricing */}
          <CollapsibleSection title="Pricing" defaultOpen={true}>
            <div className="form-grid">
              <label>
                Material ($/sq ft)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lineItem.materialCostPerSqFt}
                  onChange={(event) => props.onMaterialCostChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly}
                  title="Material cost per square foot of coverage"
                />
              </label>

              <label>
                Labor ($/sq ft)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lineItem.laborCostPerSqFt}
                  onChange={(event) => props.onLaborCostChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly}
                  title="Labor cost per square foot of installation"
                />
              </label>

              <label>
                Mobilization ($)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lineItem.mobilizationCost}
                  onChange={(event) => props.onMobilizationCostChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly}
                  title="One-time cost for equipment delivery, setup, and removal"
                />
              </label>

              <label>
                Margin (%)
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  value={(lineItem.marginRate * 100).toFixed(1)}
                  onChange={(event) => props.onMarginChange(parseNumber(event.target.value) / 100)}
                  disabled={props.isReadOnly}
                  title="Profit margin as percentage - uses real markup formula: Price = Cost / (1 - Margin/100)"
                />
              </label>
            </div>

            <div className="totals-grid" style={{ marginTop: '1rem' }}>
              <label>
                Subtotal ($)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lineItem?.subtotal ?? 0}
                  onChange={(event) => props.onSubtotalChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly || !lineItem}
                />
                <button type="button" onClick={props.onUseFormula} disabled={props.isReadOnly || !lineItem}>
                  Use Formula
                </button>
              </label>

              <label>
                Suggested total ($)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lineItem?.suggestedTotal ?? 0}
                  onChange={(event) => props.onSuggestedTotalChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly || !lineItem}
                />
                <button type="button" onClick={props.onUseSuggestion} disabled={props.isReadOnly || !lineItem}>
                  Use Suggestion
                </button>
              </label>

              <label>
                Final total ($)
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lineItem?.finalTotal ?? 0}
                  onChange={(event) => props.onFinalTotalChange(parseNumber(event.target.value))}
                  disabled={props.isReadOnly || !lineItem || lineItem.isFinalLocked}
                />
                <button type="button" onClick={props.onMatchSuggested} disabled={props.isReadOnly || !lineItem}>
                  Match Suggested
                </button>
              </label>
            </div>

            {props.bagCountWarning ? <p className="feedback error">{props.bagCountWarning}</p> : null}
            {props.depthWarning ? <p className="feedback error">{props.depthWarning}</p> : null}
            {props.scopeConflictWarning ? <p className="feedback error">{props.scopeConflictWarning}</p> : null}
          </CollapsibleSection>
        </>
      ) : null}

      {/* Section 5: Additional Scopes & Notes */}
      <CollapsibleSection title="Additional Scopes & Notes" defaultOpen={true}>
        <label className="search-field">
          Search additional scope
          <input
            value={props.scopeQuery}
            onChange={(event) => props.onScopeQueryChange(event.target.value)}
            onFocus={() => setIsScopeSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsScopeSearchFocused(false), 200)}
            placeholder="Type part of the scope name"
            disabled={props.isReadOnly}
            title="Search optional scopes like baffle installation, air sealing, vapor barriers, etc."
          />
          {!props.isReadOnly && (isScopeSearchFocused || props.scopeQuery) ? (
            <div className="search-results">
              {props.filteredScopes.map((scope) => (
                <button key={scope.key} type="button" onClick={() => props.onAddScope(scope.key)}>
                  Add {scope.label}
                </button>
              ))}
            </div>
          ) : null}
        </label>

        {lineItem && additionalScopes.length > 0 ? (
          <div className="line-items-list">
            {additionalScopes.map((scope) => (
              <article className="line-item-card" key={scope.key}>
                <div className="line-item-select">
                  <strong>{scope.name}</strong>
                  <span>
                    {scope.pricingType} · ${scope.unitPrice.toFixed(2)} · total ${scope.total.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <input
                    type="number"
                    min={0}
                    value={scope.quantity}
                    onChange={(event) => props.onScopeQuantityChange(scope.key, parseNumber(event.target.value))}
                    disabled={props.isReadOnly || scope.pricingType === 'sqft'}
                    title="Quantity of this scope item (disabled for sqft-based pricing)"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={scope.unitPrice}
                    onChange={(event) => props.onScopeUnitPriceChange(scope.key, parseNumber(event.target.value))}
                    disabled={props.isReadOnly}
                    title="Unit price for this scope item"
                  />
                  <button
                    type="button"
                    onClick={() => props.onRemoveScope(scope.key)}
                    disabled={props.isReadOnly || isRequiredScope(lineItem.serviceArea, scope.key)}
                    title={
                      isRequiredScope(lineItem.serviceArea, scope.key)
                        ? 'This scope is required by US building codes and cannot be removed'
                        : 'Remove this additional scope from the proposal'
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <label>
          Service line note
          <textarea
            value={lineItem?.note ?? ''}
            onChange={(event) => props.onLineNoteChange(event.target.value)}
            rows={2}
            disabled={props.isReadOnly || !lineItem}
            placeholder="Special instructions for this service area (e.g., 'Existing R-11 is poorly installed fiberglass')"
            title="Notes specific to this service line - displayed in preview under the service details"
          />
        </label>

        <label className="notes">
          General proposal note
          <textarea
            value={props.note}
            onChange={(event) => props.onNoteChange(event.target.value)}
            rows={2}
            disabled={props.isReadOnly}
            placeholder="General project notes (e.g., 'Includes installation and cleanup')"
            title="General notes for the entire proposal - displayed at the end of the preview"
          />
        </label>
      </CollapsibleSection>

      <p className="subtitle" style={{ marginTop: '0.75rem' }}>
        Selected line: {activeServiceAreaLabel}
      </p>
    </section>
  )
}
