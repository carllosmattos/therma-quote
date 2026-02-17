import type { PricingType } from './proposal'

export interface ScopePricingInput {
  pricingType: PricingType
  quantity: number
  unitPrice: number
  effectiveAreaSqFt: number
}

export interface TechnicalPricingInput {
  areaSqFt: number
  wasteFactorPct: number
  targetRValue: number
  existingRValue: number
  materialRValuePerInch: number
  materialCostPerSqFt: number
  laborCostPerSqFt: number
  coverageFactor: number
  applicationKey: string
  mobilizationCost: number
  additionalScopesTotal: number
  marginRate: number
}

export interface TechnicalPricingResult {
  effectiveAreaSqFt: number
  rValueToInstall: number
  depthInches: number
  materialQuantity: number
  materialUnit: string
  subtotal: number
  marginValue: number
  suggestedTotal: number
}

export function calculateEffectiveArea(areaSqFt: number, wasteFactorPct: number): number {
  const wasteFactor = 1 + Math.max(wasteFactorPct, 0) / 100
  return roundCurrency(Math.max(areaSqFt, 0) * wasteFactor)
}

export function calculateDepthInches(targetRValue: number, materialRValuePerInch: number): number {
  if (materialRValuePerInch <= 0) {
    return 0
  }

  return roundCurrency(Math.max(targetRValue, 0) / materialRValuePerInch)
}

export function calculateBagCount(effectiveAreaSqFt: number, targetRValue: number, coverageFactor: number): number {
  if (coverageFactor <= 0) {
    return 0
  }

  return roundCurrency((effectiveAreaSqFt * Math.max(targetRValue, 0)) / coverageFactor)
}

export function calculateScopeTotal(input: ScopePricingInput): number {
  const safeQuantity = Math.max(input.quantity, 0)
  const safeUnitPrice = Math.max(input.unitPrice, 0)

  if (input.pricingType === 'sqft') {
    return roundCurrency(input.effectiveAreaSqFt * safeUnitPrice)
  }

  return roundCurrency(safeQuantity * safeUnitPrice)
}

export function calculateRValueToInstall(targetRValue: number, existingRValue: number): number {
  return roundCurrency(Math.max(targetRValue - Math.max(existingRValue, 0), 0))
}

export function calculateMaterialQuantity(
  applicationKey: string,
  effectiveAreaSqFt: number,
  depthInches: number,
  rValueToInstall: number,
  coverageFactor: number,
): { quantity: number; unit: string } {
  const safeArea = Math.max(effectiveAreaSqFt, 0)

  if (applicationKey === 'blown-in' || applicationKey === 'dense-pack') {
    return {
      quantity: roundCurrency(calculateBagCount(safeArea, rValueToInstall, coverageFactor)),
      unit: 'bags',
    }
  }

  if (applicationKey === 'batt') {
    return { quantity: roundCurrency(safeArea), unit: 'sq ft' }
  }

  if (applicationKey === 'rigid-board') {
    const boards = safeArea / 32
    return { quantity: roundCurrency(boards), unit: 'boards' }
  }

  if (applicationKey === 'spray-foam-open' || applicationKey === 'spray-foam-closed') {
    const boardFeet = safeArea * Math.max(depthInches, 0)
    return { quantity: roundCurrency(boardFeet), unit: 'board feet' }
  }

  return { quantity: 0, unit: 'units' }
}

export function calculateTechnicalPricing(input: TechnicalPricingInput): TechnicalPricingResult {
  const effectiveAreaSqFt = calculateEffectiveArea(input.areaSqFt, input.wasteFactorPct)
  const rValueToInstall = calculateRValueToInstall(input.targetRValue, input.existingRValue)
  const depthInches = calculateDepthInches(rValueToInstall, input.materialRValuePerInch)
  const materialQuantityResult = calculateMaterialQuantity(
    input.applicationKey,
    effectiveAreaSqFt,
    depthInches,
    rValueToInstall,
    input.coverageFactor,
  )

  const insulationTotal = effectiveAreaSqFt * (Math.max(input.materialCostPerSqFt, 0) + Math.max(input.laborCostPerSqFt, 0))

  const subtotal = roundCurrency(insulationTotal + Math.max(input.mobilizationCost, 0) + Math.max(input.additionalScopesTotal, 0))
  
  // Real Markup formula: Suggested Total = Cost Total / (1 - Margin/100)
  const marginRateFraction = Math.max(input.marginRate, 0)
  const divisor = 1 - marginRateFraction
  const suggestedTotal = divisor > 0 ? roundCurrency(subtotal / divisor) : subtotal
  const marginValue = roundCurrency(suggestedTotal - subtotal)

  return {
    effectiveAreaSqFt,
    rValueToInstall,
    depthInches,
    materialQuantity: materialQuantityResult.quantity,
    materialUnit: materialQuantityResult.unit,
    subtotal,
    marginValue,
    suggestedTotal,
  }
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
