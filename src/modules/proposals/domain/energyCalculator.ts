import type { ServiceAreaKey } from './insulationCatalog'

/**
 * Energy Savings & ROI Calculator
 * Estimates annual energy savings and payback period based on:
 * - Climate zone (affects heating/cooling costs)
 * - R-Value improvement (more insulation = more savings)
 * - Service area (attic saves more than rim joists)
 * - Local energy rates
 */

export interface EnergyCalculatorInput {
  climateZone: number // 2-8 (from US DOE)
  serviceArea: ServiceAreaKey
  currentRValue: number // Existing R-value
  targetRValue: number // After upgrade
  areaSqFt: number // Area being insulated
  proposalCost: number // Total cost to client (after tax credit)
}

export interface EnergyCalculatorResult {
  rValueImprovement: number // Difference: targetRValue - currentRValue
  estimatedAnnualSavings: number // $ per year
  estimatedMonthlyAverage: number // $ per month (average)
  paybackPeriod: number // Years to break even
  energyPercentReduction: string // "15-25%" or similar
  estimatedROI: number // Return on investment percentage
  earnbackYear: number // In what year they'll have earned it back
}

/**
 * Average heating/cooling costs by climate zone (2026 estimates)
 * US EIA data adjusted for inflation
 */
const ENERGY_COSTS_BY_ZONE: Record<number, { heating: number; cooling: number }> = {
  2: { heating: 0.15, cooling: 0.14 }, // Tropical/warm
  3: { heating: 0.18, cooling: 0.16 }, // Hot summer
  4: { heating: 0.22, cooling: 0.15 }, // Temperate
  5: { heating: 0.25, cooling: 0.14 }, // Cold
  6: { heating: 0.28, cooling: 0.12 }, // Very cold
  8: { heating: 0.32, cooling: 0.08 }, // Alaska/extreme
}

/**
 * Energy savings potential by service area
 * Based on RESNET/DOE research: percentage of heating/cooling loss by area
 */
const ENERGY_LOSS_BY_AREA: Record<ServiceAreaKey, number> = {
  'attic-floor': 0.25, // 25% of loss happens here (biggest impact!)
  'attic-roof-deck': 0.15, // 15% (less common but significant)
  'crawl-space': 0.08, // 8% (important but smaller area)
  'basement': 0.10, // 10% (foundation losses)
  'exterior-walls': 0.30, // 30% (huge impact but expensive)
  'rim-joists': 0.05, // 5% (small but worth sealing)
  'garage-ceiling': 0.04, // 4% (conditioned space above)
}

/**
 * Calculate energy savings based on R-value improvement
 * Follows the "more insulation = diminishing returns" curve
 */
function estimateEnergySavingsFraction(rValueImprovement: number, targetRValue: number): number {
  // Simplified model: each 10 R-value improvement = ~3% total energy savings
  // But diminishing returns: R-30 to R-38 saves more than R-60 to R-70 proportionally
  
  const baseImprovement = Math.min(rValueImprovement / 10, 0.3) // Cap at 30% per 10 units
  
  // Apply diminishing returns: lower R values have bigger percentage impact
  const targetRValueFactor = Math.min(targetRValue / 60, 1.0) // Normalized to R-60
  const improvement = baseImprovement * (0.6 + 0.4 * targetRValueFactor)
  
  return Math.min(improvement, 0.35) // Cap total improvement at 35%
}

/**
 * Main function: calculate energy savings and ROI
 */
export function calculateEnergySavings(input: EnergyCalculatorInput): EnergyCalculatorResult {
  const rValueImprovement = input.targetRValue - input.currentRValue
  
  // Get base energy costs for this climate
  const costs = ENERGY_COSTS_BY_ZONE[input.climateZone] || ENERGY_COSTS_BY_ZONE[4]
  const avgCostPerTherm = (costs.heating + costs.cooling) / 2
  
  // Typical US house: ~5,000-6,000 sq ft heated
  // Energy loss through specific area scales with area size
  const houseBaseSize = 5500
  const areaFraction = input.areaSqFt / houseBaseSize
  
  // Get loss percentage for this area + scale by actual area
  const lossPercentageForArea = ENERGY_LOSS_BY_AREA[input.serviceArea] * areaFraction
  
  // Calculate improvements
  const savingsFraction = estimateEnergySavingsFraction(rValueImprovement, input.targetRValue)
  const estimatedAnnualSavings = Math.round(
    lossPercentageForArea * savingsFraction * houseBaseSize * avgCostPerTherm * 100
  ) / 100
  
  // Payback calculation
  const paybackPeriod = input.proposalCost > 0 
    ? Math.round((input.proposalCost / estimatedAnnualSavings) * 10) / 10
    : 0
  
  // ROI = (Total savings over 25 years - Cost) / Cost
  const yearsToCalculate = 25
  const totalSavings = estimatedAnnualSavings * yearsToCalculate
  const estimatedROI = (totalSavings - input.proposalCost) / input.proposalCost * 100
  
  // When does payback occur?
  const earnbackYear = Math.ceil(paybackPeriod)
  
  // Energy reduction percentage
  const reductionPercentage = Math.round(lossPercentageForArea * savingsFraction * 100)
  const energyPercentReduction = `${reductionPercentage}%-${reductionPercentage + 5}%`
  
  return {
    rValueImprovement,
    estimatedAnnualSavings,
    estimatedMonthlyAverage: Math.round(estimatedAnnualSavings / 12),
    paybackPeriod,
    energyPercentReduction,
    estimatedROI: Math.round(estimatedROI * 10) / 10,
    earnbackYear,
  }
}

/**
 * Format energy savings for display
 */
export function formatEnergySavings(result: EnergyCalculatorResult): string {
  const annual = `$${Math.round(result.estimatedAnnualSavings).toLocaleString()}/year`
  const monthly = `$${Math.round(result.estimatedMonthlyAverage)}/month`
  const payback = `${result.paybackPeriod} years`
  
  return `${annual} (${monthly}) - Pays for itself in ${payback}`
}
