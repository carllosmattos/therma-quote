export type ServiceAreaKey =
  | 'attic-floor'
  | 'attic-roof-deck'
  | 'crawl-space'
  | 'basement'
  | 'exterior-walls'
  | 'rim-joists'
  | 'garage-ceiling'

export type ApplicationKey =
  | 'batt'
  | 'blown-in'
  | 'dense-pack'
  | 'spray-foam-open'
  | 'spray-foam-closed'
  | 'rigid-board'

export type InsulationMaterialKey =
  | 'fiberglass'
  | 'cellulose'
  | 'mineral-wool'
  | 'spray-foam'
  | 'rigid-foam'

export type AdditionalScopeKey =
  | 'air-sealing'
  | 'old-insulation-removal'
  | 'sanitization'
  | 'baffle-installation'
  | 'attic-hatch-insulation'
  | 'encapsulation'

export type PricingType = 'flat' | 'unit' | 'sqft'

export interface ServiceAreaDefinition {
  key: ServiceAreaKey
  label: string
}

export interface ApplicationDefinition {
  key: ApplicationKey
  label: string
  unitLabel: string
}

export interface InsulationMaterialDefinition {
  key: InsulationMaterialKey
  label: string
  allowedApplications: ApplicationKey[]
  applicationDefaults: Record<
    ApplicationKey,
    {
      rValuePerInch: number
      defaultMaterialCostPerSqFt: number
      defaultLaborCostPerSqFt: number
      defaultCoverageFactor: number
    }
  >
}

export interface AdditionalScopeDefinition {
  key: AdditionalScopeKey
  label: string
  pricingType: PricingType
  defaultUnitPrice: number
  defaultQuantity: number
}

export interface ClimateZoneDefinition {
  zone: number
  label: string
}

export const SERVICE_AREAS: ServiceAreaDefinition[] = [
  { key: 'attic-floor', label: 'Attic (Floor)' },
  { key: 'attic-roof-deck', label: 'Attic (Roof Deck)' },
  { key: 'crawl-space', label: 'Crawl Space' },
  { key: 'basement', label: 'Basement' },
  { key: 'exterior-walls', label: 'Exterior Walls' },
  { key: 'rim-joists', label: 'Rim Joists' },
  { key: 'garage-ceiling', label: 'Garage Ceiling' },
]

export const APPLICATIONS: ApplicationDefinition[] = [
  { key: 'batt', label: 'Batts (Manta)', unitLabel: 'sq ft' },
  { key: 'blown-in', label: 'Blown-in (Soprado)', unitLabel: 'bags' },
  { key: 'dense-pack', label: 'Dense Pack', unitLabel: 'bags' },
  { key: 'spray-foam-open', label: 'Spray Foam (Open Cell)', unitLabel: 'board feet' },
  { key: 'spray-foam-closed', label: 'Spray Foam (Closed Cell)', unitLabel: 'board feet' },
  { key: 'rigid-board', label: 'Rigid Board (XPS/EPS/Polyiso)', unitLabel: 'boards' },
]

export const INSULATION_MATERIALS: InsulationMaterialDefinition[] = [
  {
    key: 'fiberglass',
    label: 'Fiberglass',
    allowedApplications: ['batt', 'blown-in'],
    applicationDefaults: {
      batt: {
        rValuePerInch: 3.2,
        defaultMaterialCostPerSqFt: 1.65,
        defaultLaborCostPerSqFt: 1.2,
        defaultCoverageFactor: 1,
      },
      'blown-in': {
        rValuePerInch: 2.5,
        defaultMaterialCostPerSqFt: 1.8,
        defaultLaborCostPerSqFt: 1.25,
        defaultCoverageFactor: 1000,
      },
      'dense-pack': {
        rValuePerInch: 2.5,
        defaultMaterialCostPerSqFt: 1.85,
        defaultLaborCostPerSqFt: 1.3,
        defaultCoverageFactor: 900,
      },
      'spray-foam-open': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'spray-foam-closed': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'rigid-board': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
    },
  },
  {
    key: 'cellulose',
    label: 'Cellulose',
    allowedApplications: ['blown-in', 'dense-pack'],
    applicationDefaults: {
      batt: {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'blown-in': {
        rValuePerInch: 3.7,
        defaultMaterialCostPerSqFt: 2.2,
        defaultLaborCostPerSqFt: 1.35,
        defaultCoverageFactor: 1100,
      },
      'dense-pack': {
        rValuePerInch: 3.7,
        defaultMaterialCostPerSqFt: 2.4,
        defaultLaborCostPerSqFt: 1.45,
        defaultCoverageFactor: 950,
      },
      'spray-foam-open': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'spray-foam-closed': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'rigid-board': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
    },
  },
  {
    key: 'mineral-wool',
    label: 'Mineral Wool',
    allowedApplications: ['batt', 'rigid-board'],
    applicationDefaults: {
      batt: {
        rValuePerInch: 3.7,
        defaultMaterialCostPerSqFt: 2.7,
        defaultLaborCostPerSqFt: 1.6,
        defaultCoverageFactor: 1,
      },
      'rigid-board': {
        rValuePerInch: 4.2,
        defaultMaterialCostPerSqFt: 3.1,
        defaultLaborCostPerSqFt: 1.8,
        defaultCoverageFactor: 1,
      },
      'blown-in': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'dense-pack': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'spray-foam-open': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'spray-foam-closed': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
    },
  },
  {
    key: 'spray-foam',
    label: 'Spray Foam',
    allowedApplications: ['spray-foam-open', 'spray-foam-closed'],
    applicationDefaults: {
      'spray-foam-open': {
        rValuePerInch: 3.5,
        defaultMaterialCostPerSqFt: 2.8,
        defaultLaborCostPerSqFt: 1.9,
        defaultCoverageFactor: 1,
      },
      'spray-foam-closed': {
        rValuePerInch: 6.5,
        defaultMaterialCostPerSqFt: 3.9,
        defaultLaborCostPerSqFt: 2.35,
        defaultCoverageFactor: 1,
      },
      batt: {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'blown-in': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'dense-pack': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'rigid-board': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
    },
  },
  {
    key: 'rigid-foam',
    label: 'Rigid Foam (Polyiso / XPS)',
    allowedApplications: ['rigid-board'],
    applicationDefaults: {
      'rigid-board': {
        rValuePerInch: 5.5,
        defaultMaterialCostPerSqFt: 3.2,
        defaultLaborCostPerSqFt: 1.9,
        defaultCoverageFactor: 1,
      },
      batt: {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'blown-in': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'dense-pack': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'spray-foam-open': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
      'spray-foam-closed': {
        rValuePerInch: 0,
        defaultMaterialCostPerSqFt: 0,
        defaultLaborCostPerSqFt: 0,
        defaultCoverageFactor: 1,
      },
    },
  },
]

export const ADDITIONAL_SCOPES: AdditionalScopeDefinition[] = [
  { key: 'air-sealing', label: 'Air Sealing', pricingType: 'flat', defaultUnitPrice: 500, defaultQuantity: 1 },
  {
    key: 'old-insulation-removal',
    label: 'Old Insulation Removal',
    pricingType: 'sqft',
    defaultUnitPrice: 1.5,
    defaultQuantity: 1,
  },
  { key: 'sanitization', label: 'Sanitization / Decontamination', pricingType: 'flat', defaultUnitPrice: 350, defaultQuantity: 1 },
  { key: 'baffle-installation', label: 'Baffle Installation', pricingType: 'unit', defaultUnitPrice: 15, defaultQuantity: 12 },
  {
    key: 'attic-hatch-insulation',
    label: 'Attic Hatch Insulation',
    pricingType: 'flat',
    defaultUnitPrice: 95,
    defaultQuantity: 1,
  },
  { key: 'encapsulation', label: 'Encapsulation', pricingType: 'sqft', defaultUnitPrice: 2.2, defaultQuantity: 1 },
]

export const DOE_CLIMATE_ZONES: ClimateZoneDefinition[] = [
  { zone: 1, label: 'Very Hot (Zone 1)' },
  { zone: 2, label: 'Hot (Zone 2)' },
  { zone: 3, label: 'Warm (Zone 3)' },
  { zone: 4, label: 'Mixed (Zone 4)' },
  { zone: 5, label: 'Cool (Zone 5)' },
  { zone: 6, label: 'Cold (Zone 6)' },
  { zone: 7, label: 'Very Cold (Zone 7)' },
  { zone: 8, label: 'Subarctic (Zone 8)' },
]

export function getMaterialByKey(key: InsulationMaterialKey): InsulationMaterialDefinition {
  return INSULATION_MATERIALS.find((item) => item.key === key) ?? INSULATION_MATERIALS[0]
}

export function getApplicationByKey(key: ApplicationKey): ApplicationDefinition {
  return APPLICATIONS.find((item) => item.key === key) ?? APPLICATIONS[0]
}

export function getApplicationLabel(key: ApplicationKey): string {
  return getApplicationByKey(key).label
}

export function getDefaultApplicationForMaterial(materialKey: InsulationMaterialKey): ApplicationKey {
  const material = getMaterialByKey(materialKey)
  return material.allowedApplications[0] ?? 'batt'
}

export function getAllowedApplicationsForMaterial(materialKey: InsulationMaterialKey): ApplicationKey[] {
  return getMaterialByKey(materialKey).allowedApplications
}

export function getMaterialDefaultsForApplication(materialKey: InsulationMaterialKey, applicationKey: ApplicationKey) {
  const material = getMaterialByKey(materialKey)
  return material.applicationDefaults[applicationKey] ?? material.applicationDefaults[getDefaultApplicationForMaterial(materialKey)]
}

export function getScopeByKey(key: AdditionalScopeKey): AdditionalScopeDefinition {
  return ADDITIONAL_SCOPES.find((item) => item.key === key) ?? ADDITIONAL_SCOPES[0]
}

export function getServiceAreaLabel(key: ServiceAreaKey): string {
  return SERVICE_AREAS.find((item) => item.key === key)?.label ?? 'Attic (Floor)'
}

export function getClimateZoneLabel(zone: number): string {
  return DOE_CLIMATE_ZONES.find((item) => item.zone === zone)?.label ?? `Zone ${zone}`
}

export function suggestTargetRValue(serviceArea: ServiceAreaKey, climateZone: number): number {
  const zone = Math.max(1, Math.min(8, climateZone))

  const isAttic = serviceArea === 'attic-floor' || serviceArea === 'attic-roof-deck'
  const isFloor = serviceArea === 'crawl-space' || serviceArea === 'basement' || serviceArea === 'garage-ceiling'

  if (isAttic) {
    // DOE/IECC 2021 recommendations for attics
    if (zone <= 2) {
      return 30 // Very Hot and Hot zones
    }

    if (zone === 3) {
      return 38 // Warm zones
    }

    if (zone === 4) {
      return 49 // Mixed climate
    }

    return 60 // Cold and Very Cold zones (5-8)
  }

  if (isFloor) {
    if (zone <= 2) {
      return 13 // Very Hot and Hot zones
    }

    if (zone === 3 || zone === 4) {
      return 19 // Warm and Mixed zones
    }

    return 30 // Cold zones
  }

  if (serviceArea === 'exterior-walls') {
    if (zone <= 2) {
      return 13 // Very Hot and Hot zones
    }

    if (zone === 3 || zone === 4) {
      return 20 // Warm and Mixed zones
    }

    if (zone >= 5 && zone <= 7) {
      return 21 // Cold zones
    }

    return 30 // Subarctic (Zone 8)
  }

  if (serviceArea === 'rim-joists') {
    if (zone <= 2) {
      return 13
    }

    if (zone === 3 || zone === 4) {
      return 19
    }

    return 30 // Cold zones
  }

  return 19
}

export function isRequiredScope(serviceArea: ServiceAreaKey, scopeKey: string): boolean {
  if (scopeKey === 'air-sealing') {
    return true
  }

  if ((serviceArea === 'attic-floor' || serviceArea === 'attic-roof-deck') && scopeKey === 'baffle-installation') {
    return true
  }

  return false
}
