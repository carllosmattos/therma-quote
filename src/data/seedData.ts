import type { Company } from '../modules/company/domain/company'
import type { Client } from '../modules/clients/domain/client'
import type { ServiceType } from '../modules/service-types/domain/serviceType'
import type { CalculationConfig } from '../modules/calculation-config/domain/calculationConfig'

export const company: Company = {
  id: 'co-therma-001',
  name: 'ThermaShield Insulation',
  laborCostPerSqFt: 1.25,
  defaultMarginRate: 0.3,
}

export const clients: Client[] = [
  {
    id: 'client-001',
    name: 'Olivia Martinez',
    email: 'olivia.martinez@email.com',
    phone: '(512) 555-0104',
    street: '1234 Oak Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
  },
  {
    id: 'client-002',
    name: 'Ethan Johnson',
    email: 'ethan.johnson@email.com',
    phone: '(214) 555-0121',
    street: '5678 Elm Avenue',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
  },
]

export const serviceTypes: ServiceType[] = [
  {
    id: 'svc-attic',
    name: 'Attic Insulation',
    model: 'AREA_BASED',
    defaultMaterialCostPerSqFt: 1.85,
    defaultLaborCostPerSqFt: 1.25,
    supportsRValue: false,
  },
  {
    id: 'svc-wall',
    name: 'Wall Insulation',
    model: 'AREA_BASED',
    defaultMaterialCostPerSqFt: 2.15,
    defaultLaborCostPerSqFt: 1.35,
    supportsRValue: false,
  },
  {
    id: 'svc-spray-foam',
    name: 'Spray Foam Installation',
    model: 'AREA_BASED',
    defaultMaterialCostPerSqFt: 2.9,
    defaultLaborCostPerSqFt: 1.95,
    supportsRValue: true,
    defaultTargetRValue: 13,
  },
]

export const calculationConfigs: CalculationConfig[] = [
  {
    serviceTypeId: 'svc-attic',
    materialCostPerSqFt: 1.85,
    suggestedMarginRate: 0.3,
  },
  {
    serviceTypeId: 'svc-wall',
    materialCostPerSqFt: 2.15,
    suggestedMarginRate: 0.32,
  },
  {
    serviceTypeId: 'svc-spray-foam',
    materialCostPerSqFt: 2.9,
    suggestedMarginRate: 0.35,
  },
]
