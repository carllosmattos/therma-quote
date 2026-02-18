import type { Company } from '../modules/company/domain/company'
import type { Client } from '../modules/clients/domain/client'
import type { ServiceType } from '../modules/service-types/domain/serviceType'
import type { CalculationConfig } from '../modules/calculation-config/domain/calculationConfig'

export const company: Company = {
  id: 'co-therma-001',
  name: 'ThermaShield Insulation',
  laborCostPerSqFt: 1.25,
  defaultMarginRate: 0.3,
  credentials: {
    licenseNumber: 'MA-INS-38421',
    licenseState: 'MA',
    licenseType: 'Insulation Contractor',
    licenseExpiryDate: '2026-12-31',
    licenseVerificationUrl: 'https://example.gov/licenses/MA-INS-38421',
    insurancePolicies: [
      {
        policyType: 'general-liability',
        provider: 'National Contractor Insurance',
        policyNumber: 'GL-2024-1188',
        coverageAmount: '$1,000,000',
        expiryDate: '2026-10-01',
        documentUrl: 'https://example.com/insurance/gl-2024-1188',
      },
      {
        policyType: 'workers-comp',
        provider: 'National Contractor Insurance',
        policyNumber: 'WC-2024-2044',
        coverageAmount: '$1,000,000',
        expiryDate: '2026-10-01',
        documentUrl: 'https://example.com/insurance/wc-2024-2044',
      },
    ],
    certifications: [
      {
        type: 'bpi',
        certNumber: 'BPI-RES-77821',
        issueDate: '2023-03-01',
        expiryDate: '2026-03-01',
        issuingBody: 'BPI',
        documentUrl: 'https://example.com/certs/bpi-res-77821',
      },
    ],
    backgroundCheckCompleted: true,
    backgroundCheckDate: '2024-01-10',
  },
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
