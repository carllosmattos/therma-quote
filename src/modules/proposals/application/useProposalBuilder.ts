import { useEffect, useMemo, useState } from 'react'
import type { Proposal, ProposalLineItem, ProposalScopeItem, ProposalStatus } from '../domain/proposal'
import {
  ADDITIONAL_SCOPES,
  APPLICATIONS,
  INSULATION_MATERIALS,
  SERVICE_AREAS,
  getApplicationByKey,
  getAllowedApplicationsForMaterial,
  getDefaultApplicationForMaterial,
  getMaterialDefaultsForApplication,
  getMaterialByKey,
  getScopeByKey,
  getServiceAreaLabel,
  suggestTargetRValue,
  isRequiredScope,
  type AdditionalScopeKey,
  type ApplicationKey,
  type InsulationMaterialKey,
  type ServiceAreaKey,
} from '../domain/insulationCatalog'
import { calculateScopeTotal, calculateTechnicalPricing, roundCurrency } from '../domain/pricing'
import type { Client } from '../../clients/domain/client'
import type { Company } from '../../company/domain/company'
import { listContractorProposals, upsertProposal, getProposal } from '../infrastructure/proposalStorage'

interface ProposalBuilderInput {
  contractorId: string
  company: Company
  clients: Client[]
  proposalId?: string
}

interface EditableProposalLineItem extends ProposalLineItem {
  isFinalLocked: boolean
}

const DEFAULT_CLIMATE_ZONE = 4

function stateToClimateZone(state: string): number {
  const upperState = state.trim().toUpperCase()

  if (['FL', 'HI', 'PR', 'GU', 'VI'].includes(upperState)) {
    return 2
  }

  if (['TX', 'LA', 'MS', 'AL', 'GA', 'SC', 'AZ', 'NM', 'CA', 'NV'].includes(upperState)) {
    return 3
  }

  if (['NC', 'TN', 'OK', 'AR', 'MO', 'KY', 'VA', 'MD', 'DE'].includes(upperState)) {
    return 4
  }

  if (['MA', 'CT', 'RI', 'PA', 'OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'NE', 'KS', 'CO', 'UT', 'OR', 'WA', 'ID', 'MT'].includes(upperState)) {
    return 5
  }

  if (['NY', 'VT', 'NH', 'ME', 'ND', 'SD', 'WY'].includes(upperState)) {
    return 6
  }

  if (['AK'].includes(upperState)) {
    return 8
  }

  return DEFAULT_CLIMATE_ZONE
}

function buildScopeItem(scopeKey: AdditionalScopeKey, effectiveAreaSqFt: number): ProposalScopeItem {
  const definition = getScopeByKey(scopeKey)
  const total = calculateScopeTotal({
    pricingType: definition.pricingType,
    quantity: definition.defaultQuantity,
    unitPrice: definition.defaultUnitPrice,
    effectiveAreaSqFt,
  })

  return {
    key: definition.key,
    name: definition.label,
    pricingType: definition.pricingType,
    quantity: definition.defaultQuantity,
    unitPrice: definition.defaultUnitPrice,
    total,
  }
}

function recalculateScopes(scopes: ProposalScopeItem[], effectiveAreaSqFt: number): ProposalScopeItem[] {
  return scopes.map((scope) => ({
    ...scope,
    total: calculateScopeTotal({
      pricingType: scope.pricingType,
      quantity: scope.quantity,
      unitPrice: scope.unitPrice,
      effectiveAreaSqFt,
    }),
  }))
}

function ensureRequiredScopes(serviceArea: ServiceAreaKey, scopes: ProposalScopeItem[], effectiveAreaSqFt: number): ProposalScopeItem[] {
  const requiredScopeKeys: AdditionalScopeKey[] = ['air-sealing']

  if (serviceArea === 'attic-floor' || serviceArea === 'attic-roof-deck') {
    requiredScopeKeys.push('baffle-installation')
  }

  const enriched = [...scopes]

  requiredScopeKeys.forEach((scopeKey) => {
    if (!enriched.some((scope) => scope.key === scopeKey)) {
      enriched.push(buildScopeItem(scopeKey, effectiveAreaSqFt))
    }
  })

  return enriched
}

function recalculateLineItem(lineItem: EditableProposalLineItem): EditableProposalLineItem {
  const requiredScopes = ensureRequiredScopes(lineItem.serviceArea as ServiceAreaKey, lineItem.additionalScopes, lineItem.effectiveAreaSqFt)
  const scopes = recalculateScopes(requiredScopes, lineItem.effectiveAreaSqFt)
  const additionalScopesTotal = roundCurrency(scopes.reduce((total, scope) => total + scope.total, 0))

  const pricing = calculateTechnicalPricing({
    areaSqFt: lineItem.areaSqFt,
    wasteFactorPct: lineItem.wasteFactorPct,
    targetRValue: lineItem.targetRValue,
    existingRValue: lineItem.existingRValue,
    materialRValuePerInch: lineItem.materialRValuePerInch,
    materialCostPerSqFt: lineItem.materialCostPerSqFt,
    laborCostPerSqFt: lineItem.laborCostPerSqFt,
    coverageFactor: lineItem.coverageFactor,
    applicationKey: lineItem.application,
    mobilizationCost: lineItem.mobilizationCost,
    additionalScopesTotal,
    marginRate: lineItem.marginRate,
  })

  // If NOT locked, always update finalTotal with suggestedTotal
  // If locked, preserve the customized finalTotal value
  const nextFinalTotal = lineItem.isFinalLocked ? lineItem.finalTotal : pricing.suggestedTotal

  return {
    ...lineItem,
    additionalScopes: scopes,
    additionalScopesTotal,
    effectiveAreaSqFt: pricing.effectiveAreaSqFt,
    rValueToInstall: pricing.rValueToInstall,
    depthInches: pricing.depthInches,
    materialQuantity: pricing.materialQuantity,
    materialUnit: pricing.materialUnit,
    subtotal: pricing.subtotal,
    marginValue: pricing.marginValue,
    suggestedTotal: pricing.suggestedTotal,
    finalTotal: roundCurrency(nextFinalTotal),
  }
}

function buildLineItem(serviceArea: ServiceAreaKey, climateZone: number, company: Company): EditableProposalLineItem {
  const material = INSULATION_MATERIALS[0]
  const applicationKey = getDefaultApplicationForMaterial(material.key)
  const defaults = getMaterialDefaultsForApplication(material.key, applicationKey)
  const targetRValue = suggestTargetRValue(serviceArea, climateZone)

  const baseLine: EditableProposalLineItem = {
    id: `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    serviceArea,
    application: applicationKey,
    materialKey: material.key,
    materialName: material.label,
    materialRValuePerInch: defaults.rValuePerInch,
    targetRValue,
    existingRValue: 0,
    rValueToInstall: targetRValue,
    depthInches: 0,
    areaSqFt: 1200,
    wasteFactorPct: 10,
    effectiveAreaSqFt: 0,
    materialCostPerSqFt: defaults.defaultMaterialCostPerSqFt,
    laborCostPerSqFt: defaults.defaultLaborCostPerSqFt || company.laborCostPerSqFt,
    coverageFactor: defaults.defaultCoverageFactor,
    materialQuantity: 0,
    materialUnit: getApplicationByKey(applicationKey).unitLabel,
    mobilizationCost: 150,
    additionalScopes: [],
    additionalScopesTotal: 0,
    subtotal: 0,
    marginRate: company.defaultMarginRate,
    marginValue: 0,
    suggestedTotal: 0,
    finalTotal: 0,
    note: '',
    isFinalLocked: false,
  }

  const calculated = recalculateLineItem(baseLine)

  return {
    ...calculated,
    finalTotal: calculated.suggestedTotal,
  }
}

function toProposalLineItem(item: EditableProposalLineItem): ProposalLineItem {
  return {
    id: item.id,
    serviceArea: item.serviceArea,
    application: item.application,
    materialKey: item.materialKey,
    materialName: item.materialName,
    materialRValuePerInch: item.materialRValuePerInch,
    targetRValue: item.targetRValue,
    existingRValue: item.existingRValue,
    rValueToInstall: item.rValueToInstall,
    depthInches: item.depthInches,
    areaSqFt: item.areaSqFt,
    wasteFactorPct: item.wasteFactorPct,
    effectiveAreaSqFt: item.effectiveAreaSqFt,
    materialCostPerSqFt: item.materialCostPerSqFt,
    laborCostPerSqFt: item.laborCostPerSqFt,
    coverageFactor: item.coverageFactor,
    materialQuantity: item.materialQuantity,
    materialUnit: item.materialUnit,
    mobilizationCost: item.mobilizationCost,
    additionalScopes: item.additionalScopes,
    additionalScopesTotal: item.additionalScopesTotal,
    subtotal: item.subtotal,
    marginRate: item.marginRate,
    marginValue: item.marginValue,
    suggestedTotal: item.suggestedTotal,
    finalTotal: item.finalTotal,
    note: item.note,
  }
}

function mapLegacyMaterialKey(rawKey?: string): InsulationMaterialKey {
  if (!rawKey) {
    return 'fiberglass'
  }

  if (rawKey.includes('cellulose')) {
    return 'cellulose'
  }

  if (rawKey.includes('rockwool')) {
    return 'mineral-wool'
  }

  if (rawKey.includes('spray-foam')) {
    return 'spray-foam'
  }

  if (rawKey.includes('rigid')) {
    return 'rigid-foam'
  }

  return 'fiberglass'
}

function mapLegacyApplication(rawApplication?: string): ApplicationKey {
  const normalized = rawApplication?.toLowerCase() ?? ''

  if (normalized.includes('dense')) {
    return 'dense-pack'
  }

  if (normalized.includes('blown')) {
    return 'blown-in'
  }

  if (normalized.includes('batt')) {
    return 'batt'
  }

  if (normalized.includes('rigid')) {
    return 'rigid-board'
  }

  if (normalized.includes('closed')) {
    return 'spray-foam-closed'
  }

  if (normalized.includes('open')) {
    return 'spray-foam-open'
  }

  if (normalized.includes('spray')) {
    return 'spray-foam-open'
  }

  return 'batt'
}

function normalizeStoredLineItem(
  rawLineItem: Partial<ProposalLineItem> & { id?: string },
  status: ProposalStatus,
  climateZone: number,
  company: Company,
): EditableProposalLineItem {
  const fallbackServiceArea = SERVICE_AREAS[0]?.key ?? 'attic-floor'
  const serviceArea = (rawLineItem.serviceArea as ServiceAreaKey | undefined) ?? fallbackServiceArea
  const materialKey = (rawLineItem.materialKey as InsulationMaterialKey | undefined) ?? mapLegacyMaterialKey(rawLineItem.materialKey as string | undefined)
  const material = getMaterialByKey(materialKey)
  const legacyApplication = mapLegacyApplication(rawLineItem.application)
  const allowedApplications = getAllowedApplicationsForMaterial(materialKey)
  const applicationKey = allowedApplications.includes(legacyApplication) ? legacyApplication : getDefaultApplicationForMaterial(materialKey)
  const defaults = getMaterialDefaultsForApplication(materialKey, applicationKey)

  const normalized: EditableProposalLineItem = {
    id: rawLineItem.id ?? `line-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    serviceArea,
    application: applicationKey,
    materialKey: material.key,
    materialName: rawLineItem.materialName ?? material.label,
    materialRValuePerInch: rawLineItem.materialRValuePerInch ?? defaults.rValuePerInch,
    targetRValue: rawLineItem.targetRValue ?? suggestTargetRValue(serviceArea, climateZone),
    existingRValue: rawLineItem.existingRValue ?? 0,
    rValueToInstall: rawLineItem.rValueToInstall ?? 0,
    depthInches: rawLineItem.depthInches ?? 0,
    areaSqFt: rawLineItem.areaSqFt ?? 1200,
    wasteFactorPct: rawLineItem.wasteFactorPct ?? 10,
    effectiveAreaSqFt: rawLineItem.effectiveAreaSqFt ?? 0,
    materialCostPerSqFt: rawLineItem.materialCostPerSqFt ?? defaults.defaultMaterialCostPerSqFt,
    laborCostPerSqFt: rawLineItem.laborCostPerSqFt ?? defaults.defaultLaborCostPerSqFt ?? company.laborCostPerSqFt,
    coverageFactor: rawLineItem.coverageFactor ?? defaults.defaultCoverageFactor,
    materialQuantity: rawLineItem.materialQuantity ?? (rawLineItem as { bagCount?: number }).bagCount ?? 0,
    materialUnit: rawLineItem.materialUnit ?? getApplicationByKey(applicationKey).unitLabel,
    mobilizationCost: rawLineItem.mobilizationCost ?? 150,
    additionalScopes: Array.isArray(rawLineItem.additionalScopes) ? rawLineItem.additionalScopes : [],
    additionalScopesTotal: rawLineItem.additionalScopesTotal ?? 0,
    subtotal: rawLineItem.subtotal ?? 0,
    marginRate: rawLineItem.marginRate ?? company.defaultMarginRate,
    marginValue: rawLineItem.marginValue ?? 0,
    suggestedTotal: rawLineItem.suggestedTotal ?? 0,
    finalTotal: rawLineItem.finalTotal ?? 0,
    note: rawLineItem.note ?? '',
    isFinalLocked: status === 'sent',
  }

  const recalculated = recalculateLineItem(normalized)

  // For draft proposals, don't preserve finalTotal - always recalculate
  // For sent proposals, preserve the locked finalTotal
  return {
    ...recalculated,
    finalTotal: status === 'sent' ? (rawLineItem.finalTotal ?? recalculated.suggestedTotal) : recalculated.suggestedTotal,
  }
}

function parseStoredLineItems(stored: Proposal | undefined, climateZone: number, company: Company): EditableProposalLineItem[] {
  if (!stored || !Array.isArray(stored.lineItems) || stored.lineItems.length === 0) {
    return []
  }

  return stored.lineItems.map((lineItem) => normalizeStoredLineItem(lineItem, stored.status, climateZone, company))
}

export function useProposalBuilder(input: ProposalBuilderInput) {
  const latestStoredProposal = useMemo(() => {
    if (input.proposalId) {
      return getProposal(input.proposalId) ?? undefined
    }
    const proposals = listContractorProposals(input.contractorId)
    return proposals.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]
  }, [input.contractorId, input.proposalId])

  const initialClient = input.clients.find((client) => client.id === (latestStoredProposal?.clientId ?? input.clients[0]?.id))
  const initialClimateZone = latestStoredProposal?.climateZone ?? stateToClimateZone(initialClient?.state ?? 'TX')
  const initialLineItems = parseStoredLineItems(latestStoredProposal, initialClimateZone, input.company)

  const [clientQuery, setClientQuery] = useState(initialClient?.name ?? '')
  const [areaQuery, setAreaQuery] = useState('')
  const [scopeQuery, setScopeQuery] = useState('')
  const [clientId, setClientId] = useState(initialClient?.id ?? '')
  const [climateZone, setClimateZone] = useState(initialClimateZone)
  const [lineItems, setLineItems] = useState<EditableProposalLineItem[]>(initialLineItems)
  const [activeLineItemId, setActiveLineItemId] = useState(initialLineItems[0]?.id ?? '')
  const [note, setNote] = useState(latestStoredProposal?.note ?? 'Includes installation and cleanup.')
  const [proposalStatus, setProposalStatus] = useState<ProposalStatus>(latestStoredProposal?.status ?? 'draft')
  const [proposalId] = useState(latestStoredProposal?.id ?? `proposal-${input.contractorId}`)
  const [createdAt] = useState(latestStoredProposal?.createdAt ?? new Date().toISOString())
  const [isSending, setIsSending] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const selectedClient = useMemo(
    () => input.clients.find((client) => client.id === clientId) ?? input.clients[0],
    [clientId, input.clients],
  )

  const activeLineItem = useMemo(
    () => lineItems.find((lineItem) => lineItem.id === activeLineItemId) ?? lineItems[0],
    [activeLineItemId, lineItems],
  )

  const filteredClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase()
    if (!query) {
      return input.clients.slice(0, 6)
    }

    return input.clients.filter((client) => client.name.toLowerCase().includes(query)).slice(0, 6)
  }, [clientQuery, input.clients])

  const filteredServiceAreas = useMemo(() => {
    const query = areaQuery.trim().toLowerCase()
    if (!query) {
      return SERVICE_AREAS
    }

    return SERVICE_AREAS.filter((item) => item.label.toLowerCase().includes(query))
  }, [areaQuery])

  const filteredScopes = useMemo(() => {
    const query = scopeQuery.trim().toLowerCase()
    if (!query) {
      return ADDITIONAL_SCOPES
    }

    return ADDITIONAL_SCOPES.filter((item) => item.label.toLowerCase().includes(query))
  }, [scopeQuery])

  const isReadOnly = proposalStatus === 'sent'

  const proposalTotals = useMemo(() => {
    // Subtotal = soma dos finalTotal de cada linha (valor COM margem)
    const subtotal = roundCurrency(lineItems.reduce((total, item) => total + item.finalTotal, 0))
    
    // SuggestedTotal = soma dos valores sugeridos (usado apenas para referência interna)
    const suggestedTotal = roundCurrency(lineItems.reduce((total, item) => total + item.suggestedTotal, 0))
    
    // Final Total = mesmo que Subtotal (valor total da proposta)
    const finalTotal = subtotal
    
    // Tax Credit = 30% do Subtotal (máximo $1,200 para zona 5)
    const taxCredit = roundCurrency(Math.min(subtotal * 0.3, 1200))
    
    // Net Investment = Subtotal - Tax Credit (quanto o cliente paga APÓS desconto federal)
    const netPrice = roundCurrency(subtotal - taxCredit)

    return { subtotal, suggestedTotal, finalTotal, taxCredit, netPrice }
  }, [lineItems])

  const bagCountWarning = useMemo(() => {
    if (!activeLineItem) {
      return ''
    }

    if (activeLineItem.application !== 'blown-in' && activeLineItem.application !== 'dense-pack') {
      return ''
    }

    const area = Math.max(activeLineItem.areaSqFt, 0)
    if (area <= 0) {
      return ''
    }

    const perThousand = activeLineItem.materialQuantity / (area / 1000)
    if (perThousand > 50 || perThousand < 20 || activeLineItem.materialQuantity > 500) {
      return 'Bag count looks off. For 1,000 sq ft, blown-in bags should land between 20 and 50.'
    }

    return ''
  }, [activeLineItem])

  const scopeConflictWarning = useMemo(() => {
    const hasAtticFloor = lineItems.some((item) => item.serviceArea === 'attic-floor')
    const hasAtticRoofDeck = lineItems.some((item) => item.serviceArea === 'attic-roof-deck')

    if (hasAtticFloor && hasAtticRoofDeck) {
      return 'IECC Code Conflict: Proposal contains both Attic Floor and Attic Roof Deck. US building codes typically use either attic floor (vented) OR roof deck (unvented) insulation, not both. This may violate moisture control requirements.'
    }

    return ''
  }, [lineItems])

  const depthWarning = useMemo(() => {
    if (!activeLineItem) {
      return ''
    }

    // Attic Roof Deck - Fiberglass Batts sag under their own weight
    if (activeLineItem.serviceArea === 'attic-roof-deck' && activeLineItem.application === 'batt') {
      if (activeLineItem.materialKey === 'fiberglass' && activeLineItem.depthInches > 12) {
        return 'Fiberglass Batts on Roof Deck exceeding 12" will sag and compress under their own weight. Use Spray Foam (Open/Closed Cell) or Rigid Board instead.'
      }
    }

    // Attic Floor - Compression risk from foot traffic
    if (activeLineItem.serviceArea === 'attic-floor' && activeLineItem.application === 'batt') {
      if (activeLineItem.depthInches > 16) {
        return 'Attic Floor batts exceeding 16" will compress with foot traffic (HVAC maintenance, storage). Use Blown-In Cellulose or Fiberglass for depths >12".'
      }
      if (activeLineItem.depthInches > 12) {
        return 'Attic Floor batts exceeding 12" may compress in traffic areas. Consider switching to Blown-In application or install walkways.'
      }
    }

    // Crawl Space - Sagging and moisture concerns
    if (activeLineItem.serviceArea === 'crawl-space') {
      if (activeLineItem.application === 'batt' && activeLineItem.depthInches > 13) {
        return 'Crawl space batts exceeding 13" are difficult to install properly. Consider Dense-Pack or Spray Foam.'
      }
      if (activeLineItem.application === 'batt' && activeLineItem.depthInches > 10) {
        return 'Crawl space batts require proper mechanical support (wire mesh, tiger teeth) to prevent sagging. Verify installation method.'
      }
      if (activeLineItem.application === 'spray-foam-open' && activeLineItem.depthInches > 10) {
        return 'Open-cell spray foam in crawl spaces typically should not exceed 10" due to moisture vapor concerns. Consider closed-cell spray foam for better moisture control.'
      }
    }

    // Basement - Similar concerns to crawl space
    if (activeLineItem.serviceArea === 'basement') {
      if (activeLineItem.application === 'batt' && activeLineItem.depthInches > 10) {
        return 'Basement wall batts exceeding 10" require proper support systems. Consider Spray Foam for full encapsulation.'
      }
    }

    return ''
  }, [activeLineItem])

  useEffect(() => {
    const proposalToSave: Proposal = {
      id: proposalId,
      contractorId: input.contractorId,
      companyId: input.company.id,
      clientId: selectedClient?.id ?? '',
      climateZone,
      status: proposalStatus,
      subtotal: proposalTotals.subtotal,
      suggestedTotal: proposalTotals.suggestedTotal,
      taxCredit: proposalTotals.taxCredit,
      netPrice: proposalTotals.netPrice,
      finalTotal: proposalTotals.finalTotal,
      createdAt,
      updatedAt: new Date().toISOString(),
      note,
      lineItems: lineItems.map(toProposalLineItem),
    }

    upsertProposal(proposalToSave)
  }, [
    climateZone,
    createdAt,
    input.company.id,
    input.contractorId,
    lineItems,
    note,
    proposalId,
    proposalStatus,
    proposalTotals.finalTotal,
    proposalTotals.netPrice,
    proposalTotals.subtotal,
    proposalTotals.suggestedTotal,
    proposalTotals.taxCredit,
    selectedClient?.id,
  ])

  const nextProposalStatus: ProposalStatus | null = 
    proposalStatus === 'draft' ? 'sent' 
    : proposalStatus === 'sent' ? 'accepted'
    : proposalStatus === 'accepted' ? 'completed'
    : null

  const proposal: Proposal = {
    id: proposalId,
    contractorId: input.contractorId,
    companyId: input.company.id,
    clientId: selectedClient?.id ?? '',
    climateZone,
    status: proposalStatus,
    subtotal: proposalTotals.subtotal,
    suggestedTotal: proposalTotals.suggestedTotal,
    taxCredit: proposalTotals.taxCredit,
    netPrice: proposalTotals.netPrice,
    finalTotal: proposalTotals.finalTotal,
    createdAt,
    updatedAt: new Date().toISOString(),
    note,
    lineItems: lineItems.map(toProposalLineItem),
  }

  function showActionMessage(message: string) {
    setActionMessage(message)
    window.setTimeout(() => {
      setActionMessage('')
    }, 1600)
  }

  function updateActiveLineItem(updater: (lineItem: EditableProposalLineItem) => EditableProposalLineItem) {
    if (!activeLineItem || isReadOnly) {
      return
    }

    setLineItems((current) => current.map((lineItem) => (lineItem.id === activeLineItem.id ? updater(lineItem) : lineItem)))
  }

  function selectClient(nextClientId: string) {
    if (isReadOnly) {
      return
    }

    setClientId(nextClientId)
    const client = input.clients.find((item) => item.id === nextClientId)
    setClientQuery(client?.name ?? '')
    updateClimateZone(stateToClimateZone(client?.state ?? 'TX'))
  }

  function updateClimateZone(nextZone: number) {
    const safeZone = Math.max(1, Math.min(8, Math.round(nextZone)))
    setClimateZone(safeZone)

    setLineItems((current) =>
      current.map((lineItem) =>
        recalculateLineItem({
          ...lineItem,
          targetRValue: suggestTargetRValue(lineItem.serviceArea as ServiceAreaKey, safeZone),
        }),
      ),
    )
  }

  function addServiceLine(serviceArea: ServiceAreaKey) {
    if (isReadOnly) {
      return
    }

    const lineItem = buildLineItem(serviceArea, climateZone, input.company)

    setLineItems((current) => [...current, lineItem])
    setActiveLineItemId(lineItem.id)
    setAreaQuery(getServiceAreaLabel(serviceArea))
    showActionMessage(`${getServiceAreaLabel(serviceArea)} added to proposal.`)
  }

  function removeServiceLine(lineItemId: string) {
    if (isReadOnly) {
      return
    }

    const nextItems = lineItems.filter((lineItem) => lineItem.id !== lineItemId)
    setLineItems(nextItems)

    if (activeLineItemId === lineItemId) {
      setActiveLineItemId(nextItems[0]?.id ?? '')
    }
  }

  function selectActiveLine(lineItemId: string) {
    const lineItem = lineItems.find((item) => item.id === lineItemId)
    if (!lineItem) {
      return
    }

    setActiveLineItemId(lineItemId)
  }

  function setMaterial(materialKey: InsulationMaterialKey) {
    updateActiveLineItem((lineItem) => {
      const material = getMaterialByKey(materialKey)
      const allowedApplications = getAllowedApplicationsForMaterial(materialKey)
      const nextApplication = allowedApplications.includes(lineItem.application as ApplicationKey)
        ? (lineItem.application as ApplicationKey)
        : getDefaultApplicationForMaterial(materialKey)
      const defaults = getMaterialDefaultsForApplication(materialKey, nextApplication)

      return recalculateLineItem({
        ...lineItem,
        materialKey: material.key,
        materialName: material.label,
        materialRValuePerInch: defaults.rValuePerInch,
        materialCostPerSqFt: defaults.defaultMaterialCostPerSqFt,
        laborCostPerSqFt: defaults.defaultLaborCostPerSqFt,
        coverageFactor: defaults.defaultCoverageFactor,
        application: nextApplication,
        materialUnit: getApplicationByKey(nextApplication).unitLabel,
      })
    })
  }

  function setApplication(application: ApplicationKey) {
    updateActiveLineItem((lineItem) => {
      const allowedApplications = getAllowedApplicationsForMaterial(lineItem.materialKey as InsulationMaterialKey)
      if (allowedApplications.length === 0) {
        return lineItem
      }
      const nextApplication = allowedApplications.includes(application) ? application : allowedApplications[0]
      const defaults = getMaterialDefaultsForApplication(lineItem.materialKey as InsulationMaterialKey, nextApplication)

      return recalculateLineItem({
        ...lineItem,
        application: nextApplication,
        materialRValuePerInch: defaults.rValuePerInch,
        materialCostPerSqFt: defaults.defaultMaterialCostPerSqFt,
        laborCostPerSqFt: defaults.defaultLaborCostPerSqFt,
        coverageFactor: defaults.defaultCoverageFactor,
        materialUnit: getApplicationByKey(nextApplication).unitLabel,
      })
    })
  }

  function setAreaSqFt(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, areaSqFt: Math.max(value, 0) }))
  }

  function setWasteFactorPct(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, wasteFactorPct: Math.max(value, 0) }))
  }

  function setTargetRValue(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, targetRValue: Math.max(value, 1) }))
  }

  function setExistingRValue(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, existingRValue: Math.max(value, 0) }))
  }

  function setRValuePerInch(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, materialRValuePerInch: Math.max(value, 0.1) }))
  }

  function setMaterialCostPerSqFt(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, materialCostPerSqFt: Math.max(value, 0) }))
  }

  function setLaborCostPerSqFt(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, laborCostPerSqFt: Math.max(value, 0) }))
  }

  function setCoverageFactor(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, coverageFactor: Math.max(value, 1) }))
  }

  function setMobilizationCost(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, mobilizationCost: Math.max(value, 0) }))
  }

  function setMarginRate(value: number) {
    updateActiveLineItem((lineItem) => recalculateLineItem({ ...lineItem, marginRate: Math.max(value, 0) }))
  }

  function addScope(scopeKey: AdditionalScopeKey) {
    updateActiveLineItem((lineItem) => {
      if (lineItem.additionalScopes.some((scope) => scope.key === scopeKey)) {
        return lineItem
      }

      const scope = buildScopeItem(scopeKey, lineItem.effectiveAreaSqFt)
      return recalculateLineItem({
        ...lineItem,
        additionalScopes: [...lineItem.additionalScopes, scope],
      })
    })
    setScopeQuery('')
  }

  function updateScope(scopeKey: string, field: 'quantity' | 'unitPrice', value: number) {
    updateActiveLineItem((lineItem) => {
      const nextScopes = lineItem.additionalScopes.map((scope) =>
        scope.key === scopeKey ? { ...scope, [field]: Math.max(value, 0) } : scope,
      )

      return recalculateLineItem({ ...lineItem, additionalScopes: nextScopes })
    })
  }

  function removeScope(scopeKey: string) {
    updateActiveLineItem((lineItem) =>
      isRequiredScope(lineItem.serviceArea as ServiceAreaKey, scopeKey)
        ? lineItem
        : recalculateLineItem({
            ...lineItem,
            additionalScopes: lineItem.additionalScopes.filter((scope) => scope.key !== scopeKey),
          }),
    )
  }

  function setSubtotal(value: number) {
    updateActiveLineItem((lineItem) => ({ ...lineItem, subtotal: roundCurrency(value) }))
  }

  function setSuggestedTotal(value: number) {
    updateActiveLineItem((lineItem) => ({ ...lineItem, suggestedTotal: roundCurrency(value) }))
  }

  function setFinalTotal(value: number) {
    updateActiveLineItem((lineItem) => {
      if (lineItem.isFinalLocked) {
        return lineItem
      }

      // When user manually edits finalTotal, lock it to prevent auto-updates
      return { ...lineItem, finalTotal: roundCurrency(value), isFinalLocked: true }
    })
  }

  function setLineNote(value: string) {
    updateActiveLineItem((lineItem) => ({
      ...lineItem,
      note: value,
    }))
  }

  function useFormula() {
    updateActiveLineItem((lineItem) => ({
      ...recalculateLineItem(lineItem),
      isFinalLocked: false, // Unlock to allow auto-updates
    }))
    showActionMessage('Formula applied to selected service line.')
  }

  function useSuggestion() {
    updateActiveLineItem((lineItem) => ({
      ...lineItem,
      finalTotal: roundCurrency(lineItem.suggestedTotal),
      isFinalLocked: false,
    }))
    showActionMessage('Suggested total copied to final for selected line.')
  }

  function matchSuggested() {
    updateActiveLineItem((lineItem) => ({
      ...lineItem,
      finalTotal: roundCurrency(lineItem.suggestedTotal),
      isFinalLocked: true,
    }))
    showActionMessage('Final total matched and locked for selected line.')
  }

  async function moveToSent() {
    if (proposalStatus === 'sent') {
      return
    }

    setIsSending(true)
    setSuccessMessage('')

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450)
    })

    setProposalStatus('sent')
    setLineItems((current) => current.map((lineItem) => ({ ...lineItem, isFinalLocked: true })))
    setIsSending(false)
    setSuccessMessage('Proposal sent successfully')
    setActionMessage('')
  }

  async function acceptProposal() {
    if (proposalStatus !== 'sent') {
      return
    }

    if (!window.confirm('Accept this proposal?')) {
      return
    }

    setIsSending(true)
    setSuccessMessage('')

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450)
    })

    setProposalStatus('accepted')
    setIsSending(false)
    setSuccessMessage('Proposal accepted')
    setActionMessage('')
  }

  async function rejectProposal() {
    if (proposalStatus !== 'sent') {
      return
    }

    if (!window.confirm('Reject this proposal?')) {
      return
    }

    setIsSending(true)
    setSuccessMessage('')

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450)
    })

    setProposalStatus('rejected')
    setIsSending(false)
    setSuccessMessage('Proposal rejected')
    setActionMessage('')
  }

  async function completeProposal() {
    if (proposalStatus !== 'accepted') {
      return
    }

    if (!window.confirm('Mark proposal as completed?')) {
      return
    }

    setIsSending(true)
    setSuccessMessage('')

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450)
    })

    setProposalStatus('completed')
    setIsSending(false)
    setSuccessMessage('Proposal completed')
    setActionMessage('')
  }

  async function cancelProposal() {
    if (!window.confirm('Cancel this proposal? This action cannot be undone.')) {
      return
    }

    setIsSending(true)
    setSuccessMessage('')

    await new Promise((resolve) => {
      window.setTimeout(resolve, 450)
    })

    setProposalStatus('canceled')
    setIsSending(false)
    setSuccessMessage('Proposal canceled')
    setActionMessage('')
  }

  return {
    state: {
      clientQuery,
      areaQuery,
      scopeQuery,
      filteredClients,
      filteredServiceAreas,
      filteredScopes,
      selectedClient,
      climateZone,
      lineItems,
      activeLineItem,
      activeLineItemId,
      proposalTotals,
      bagCountWarning,
      depthWarning,
      scopeConflictWarning,
      isReadOnly,
      isSending,
      successMessage,
      actionMessage,
      note,
      nextProposalStatus,
      proposal,
      materials: INSULATION_MATERIALS,
      serviceAreas: SERVICE_AREAS,
      applications: APPLICATIONS,
    },
    actions: {
      setClientQuery,
      setAreaQuery,
      setScopeQuery,
      setClimateZone: updateClimateZone,
      selectClient,
      addServiceLine,
      removeServiceLine,
      selectActiveLine,
      setMaterial,
      setApplication,
      setRValuePerInch,
      setAreaSqFt,
      setWasteFactorPct,
      setTargetRValue,
      setExistingRValue,
      setMaterialCostPerSqFt,
      setLaborCostPerSqFt,
      setCoverageFactor,
      setMobilizationCost,
      setMarginRate,
      addScope,
      updateScope,
      removeScope,
      setSubtotal,
      setSuggestedTotal,
      setFinalTotal,
      setLineNote,
      setNote,
      useFormula,
      useSuggestion,
      matchSuggested,
      moveToSent,
      acceptProposal,
      rejectProposal,
      completeProposal,
      cancelProposal,
    },
  }
}
