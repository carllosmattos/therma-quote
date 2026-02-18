import type { ApplicationKey, InsulationMaterialKey, ServiceAreaKey } from './insulationCatalog'
import type { ProposalComplianceSummary } from './compliance'

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed' | 'canceled'

export type PricingType = 'flat' | 'unit' | 'sqft'

export interface ProposalScopeItem {
  key: string
  name: string
  pricingType: PricingType
  quantity: number
  unitPrice: number
  total: number
}

export interface ProposalLineItem {
  id: string
  serviceArea: ServiceAreaKey
  application: ApplicationKey
  materialKey: InsulationMaterialKey
  materialName: string
  materialRValuePerInch: number
  targetRValue: number
  existingRValue: number
  rValueToInstall: number
  depthInches: number
  areaSqFt: number
  wasteFactorPct: number
  effectiveAreaSqFt: number
  materialCostPerSqFt: number
  laborCostPerSqFt: number
  coverageFactor: number
  materialQuantity: number
  materialUnit: string
  mobilizationCost: number
  additionalScopes: ProposalScopeItem[]
  additionalScopesTotal: number
  subtotal: number // Cost WITHOUT margin (material + labor + mobilization + scopes)
  marginRate: number
  marginValue: number
  suggestedTotal: number // Cost WITH margin applied (formula-calculated)
  finalTotal: number // Editable final price for this line item
  note: string // Service-specific notes and observations
  
  // Tax Credit (IRA 2024)
  taxCredit: number // Federal tax credit eligible for this line item
  taxCreditMax: number // Maximum allowed for this material type
  taxCreditPercentage: number // Percentage of cost eligible (30%)
  
  // Energy Savings Estimation
  estimatedAnnualSavings?: number // $ saved per year
  estimatedMonthlyAverage?: number // $ saved per month
  paybackPeriod?: number // Years to break even
  energyPercentReduction?: string // "15%-20%" or similar
}

export interface Proposal {
  id: string
  contractorId: string
  companyId: string
  clientId: string
  climateZone: number
  status: ProposalStatus
  subtotal: number // Sum of all line item finalTotal (total proposal cost WITH margin)
  suggestedTotal: number // Sum of all line item suggestedTotal (internal reference only)
  taxCredit: number // Sum of all line item tax credits (IRA 2024)
  netPrice: number // Subtotal - taxCredit (what client pays AFTER federal discount)
  finalTotal: number // Same as subtotal (kept for compatibility)
  createdAt: string
  updatedAt: string
  lineItems: ProposalLineItem[]
  note: string // General proposal notes
  deletedAt?: string
  
  // Energy Savings Summary
  totalEstimatedAnnualSavings?: number // All line items combined
  totalEstimatedMonthlyAverage?: number
  recommendedPaybackPeriod?: number // Years to break even
  
  // Good-Better-Best pricing tier (if using tiered presentation)
  pricingTier?: 'good' | 'better' | 'best' // Which option is this

  // Compliance summary
  complianceSummary?: ProposalComplianceSummary
}
