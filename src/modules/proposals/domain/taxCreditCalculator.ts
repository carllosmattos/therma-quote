import type { ApplicationKey, InsulationMaterialKey } from './insulationCatalog'

/**
 * IRA 2024 Tax Credit Calculator
 * 30% tax credit on qualified insulation products and services
 * Different caps based on material and application type
 */

export interface TaxCreditInput {
  materialKey: InsulationMaterialKey
  applicationKey: ApplicationKey
  subtotal: number // Cost before tax credit
}

export interface TaxCreditResult {
  eligibleAmount: number // Amount eligible for credit (e.g., material only, or material+labor)
  creditPercentage: number // 30% for all qualified materials
  taxCredit: number // Calculated tax credit
  maxCredit: number // Maximum allowed credit for this type
  netPrice: number // Subtotal after credit
}

/**
 * Get the maximum tax credit allowed for a material/application combination
 * Based on IRA 2024 regulations as of 2026
 */
function getMaxTaxCredit(materialKey: InsulationMaterialKey, applicationKey: ApplicationKey): number {
  // Spray Foam Closed Cell: $1,200 (highest tier)
  if (materialKey === 'spray-foam' && applicationKey === 'spray-foam-closed') {
    return 1200
  }

  // Spray Foam Open Cell: $600
  if (materialKey === 'spray-foam' && applicationKey === 'spray-foam-open') {
    return 600
  }

  // Fiberglass, Cellulose, Mineral Wool (most common): $600
  if (['fiberglass', 'cellulose', 'mineral-wool'].includes(materialKey)) {
    return 600
  }

  // Rigid Foam: $600
  if (materialKey === 'rigid-foam') {
    return 600
  }

  // Default safe fallback
  return 600
}

/**
 * Determine what percentage of the cost is eligible for tax credit
 * All current materials: 30% of material + labor costs eligible
 */
function getEligibleCostPercentage(): number {
  // This is simplified; in reality some might be material-only
  return 0.3
}

/**
 * Calculate IRA tax credit for a proposal line item
 * This is what the homeowner can deduct from federal taxes
 */
export function calculateTaxCredit(input: TaxCreditInput): TaxCreditResult {
  const creditPercentage = getEligibleCostPercentage()
  const maxCredit = getMaxTaxCredit(input.materialKey, input.applicationKey)

  // Calculate tax credit: 30% of eligible costs, capped at max
  const eligibleAmount = input.subtotal
  const calculatedCredit = Math.round(eligibleAmount * creditPercentage * 100) / 100
  const taxCredit = Math.min(calculatedCredit, maxCredit)

  const netPrice = Math.round((input.subtotal - taxCredit) * 100) / 100

  return {
    eligibleAmount,
    creditPercentage: creditPercentage * 100, // Return as percentage (30 = 30%)
    taxCredit,
    maxCredit,
    netPrice,
  }
}

/**
 * Get a human-readable description of the tax credit for this material
 */
export function describeTaxCredit(materialKey: InsulationMaterialKey, applicationKey: ApplicationKey): string {
  const maxCredit = getMaxTaxCredit(materialKey, applicationKey)
  return `30% federal tax credit (up to $${maxCredit.toLocaleString()})`
}
