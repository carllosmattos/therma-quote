import type { ProposalLineItem } from './proposal'

/**
 * Good-Better-Best Options Generator
 * Creates three tiers of proposals for the same service area
 * Increases average closing price by 25-30% (vs single option)
 */

export type ProposalOptionTier = 'good' | 'better' | 'best'

export interface ProposalOption {
  tier: ProposalOptionTier
  label: string
  description: string
  lineItems: ProposalLineItem[]
  subtotal: number
  taxCredit: number
  netPrice: number
  warranty: string // e.g., "3-year", "10-year"
  recommended: boolean // Show as "recommended" badge
}

/**
 * Generate three proposal options (Good-Better-Best) from a line item
 * Modifies R-value targets and adds/removes scopes
 */
export function generateProposalOptions(
  baseLineItem: ProposalLineItem,
  climateZone: number,
): ProposalOption[] {
  // These would be generated from the base line item
  // For now, show the structure
  
  const good = generateGoodOption(baseLineItem)
  const better = generateBetterOption(baseLineItem, climateZone)
  const best = generateBestOption(baseLineItem, climateZone)
  
  return [good, better, best]
}

/**
 * GOOD: Meet minimum code requirements
 * - Lower R-value (meets IBC/IRC minimum)
 * - Basic air sealing only
 * - Standard warranty
 */
function generateGoodOption(baseLineItem: ProposalLineItem): ProposalOption {
  const lineItem = structuredClone(baseLineItem)
  
  // Reduce target R-value to minimum code (typically R-38 for attic)
  const minRValueMap: Record<string, number> = {
    'attic-floor': 38,
    'attic-roof-deck': 30,
    'crawl-space': 13,
    'basement': 13,
    'exterior-walls': 13,
    'rim-joists': 13,
    'garage-ceiling': 13,
  }
  
  const minRValue = minRValueMap[lineItem.serviceArea] || 13
  const rValueReduction = Math.max(0, lineItem.targetRValue - minRValue)
  
  // Scale costs down proportionally
  const costReduction = (rValueReduction / lineItem.targetRValue) * 0.4 // 40% of R-value difference
  const scaleFactor = 1 - costReduction
  
  const modifiedItem = {
    ...lineItem,
    targetRValue: minRValue,
    suggestedTotal: Math.round(lineItem.suggestedTotal * scaleFactor * 100) / 100,
    finalTotal: Math.round(lineItem.finalTotal * scaleFactor * 100) / 100,
  }
  
  return {
    tier: 'good',
    label: 'Good',
    description: 'Meets building code requirements',
    lineItems: [modifiedItem],
    subtotal: Math.round(modifiedItem.finalTotal * 100) / 100,
    taxCredit: Math.round(modifiedItem.finalTotal * 0.3 * 100) / 100,
    netPrice: Math.round(modifiedItem.finalTotal * 0.7 * 100) / 100,
    warranty: '3-year workmanship',
    recommended: false,
  }
}

/**
 * BETTER: Energy Star Standard (RECOMMENDED)
 * - R-60 for attics (or climate-appropriate)
 * - Complete air sealing
 * - Full preparation
 * - 5-year warranty
 * This is typically what contractors should recommend
 */
function generateBetterOption(baseLineItem: ProposalLineItem, climateZone: number): ProposalOption {
  const lineItem = structuredClone(baseLineItem)
  
  // Better option = Energy Star baseline (usually R-60 for attics)
  const energyStarTargets: Record<number, number> = {
    2: 38, // Warm climates need less
    3: 49,
    4: 56,
    5: 60,
    6: 60,
    8: 70, // Alaska needs more
  }
  
  const targetRValue = energyStarTargets[climateZone] || 60
  const costIncrease = Math.min((targetRValue - lineItem.targetRValue) / 60, 0.15) // Max 15% increase
  const scaleFactor = 1 + costIncrease
  
  const modifiedItem = {
    ...lineItem,
    targetRValue,
    suggestedTotal: Math.round(lineItem.suggestedTotal * scaleFactor * 100) / 100,
    finalTotal: Math.round(lineItem.finalTotal * scaleFactor * 100) / 100,
  }
  
  return {
    tier: 'better',
    label: 'Better (Recommended)',
    description: 'Energy Star standard - best value for most homeowners',
    lineItems: [modifiedItem],
    subtotal: Math.round(modifiedItem.finalTotal * 100) / 100,
    taxCredit: Math.round(modifiedItem.finalTotal * 0.3 * 100) / 100,
    netPrice: Math.round(modifiedItem.finalTotal * 0.7 * 100) / 100,
    warranty: '5-year workmanship + satisfaction guarantee',
    recommended: true,
  }
}

/**
 * BEST: Maximum Performance
 * - High R-value (R-70+ depending on application)
 * - Spray foam or dense-pack cellulose for better air sealing
 * - Extended warranty
 * - For premium positioning
 */
function generateBestOption(baseLineItem: ProposalLineItem, climateZone: number): ProposalOption {
  const lineItem = structuredClone(baseLineItem)
  
  // Best = Premium insulation performance
  const premiumTargets: Record<number, number> = {
    2: 49,
    3: 60,
    4: 70,
    5: 75,
    6: 80,
    8: 90,
  }
  
  const targetRValue = premiumTargets[climateZone] || 75
  const costIncrease = (targetRValue - lineItem.targetRValue) / 60 * 0.35 // 35% scale for premium
  const scaleFactor = 1 + costIncrease
  
  const modifiedItem = {
    ...lineItem,
    targetRValue,
    suggestedTotal: Math.round(lineItem.suggestedTotal * scaleFactor * 100) / 100,
    finalTotal: Math.round(lineItem.finalTotal * scaleFactor * 100) / 100,
  }
  
  return {
    tier: 'best',
    label: 'Best',
    description: 'Maximum comfort and efficiency - premium performance',
    lineItems: [modifiedItem],
    subtotal: Math.round(modifiedItem.finalTotal * 100) / 100,
    taxCredit: Math.round(modifiedItem.finalTotal * 0.3 * 100) / 100,
    netPrice: Math.round(modifiedItem.finalTotal * 0.7 * 100) / 100,
    warranty: '10-year warranty + lifetime customer support',
    recommended: false,
  }
}

/**
 * Calculate the psychological advantage of presenting 3 options
 * Research shows clients choose the middle option ~60% of the time
 * This is the "Goldilocks principle"
 */
export function getCoreOptionRecommendation(options: ProposalOption[]): ProposalOption {
  return options.find(o => o.recommended) || options[1]!
}
