import { useMemo } from 'react'
import type { Proposal } from '../domain/proposal'
import { generateProposalOptions, getCoreOptionRecommendation } from '../domain/proposalOptions'
import type { ProposalOption } from '../domain/proposalOptions'

/**
 * Hook for generating Good-Better-Best proposal options
 * Provides three tiers of the same service for client choice
 * 
 * Psychology: Clients typically choose the middle option (Better)
 * This increases average ticket price by 25-30%
 */
export function useProposalOptions(proposal: Proposal | undefined) {
  const options = useMemo(() => {
    if (!proposal || !proposal.lineItems.length) {
      return []
    }

    // Generate all options from the first line item (usually one service area per proposal)
    // In a multi-area proposal, you might want to apply to all and combine
    const firstLineItem = proposal.lineItems[0]!
    return generateProposalOptions(firstLineItem, proposal.climateZone)
  }, [proposal?.id, proposal?.lineItems, proposal?.climateZone])

  const recommendedOption = useMemo(() => {
    return options.length > 0 ? getCoreOptionRecommendation(options) : undefined
  }, [options])

  return {
    options,
    recommendedOption,
    isMultiOption: options.length > 1,
    savings: calculateOptionSavings(options),
  }
}

/**
 * Calculate the financial difference between options
 */
function calculateOptionSavings(options: ProposalOption[]): OptionSavingsAnalysis {
  if (options.length < 2) {
    return {
      goodVsBetter: { priceDifference: 0, percentDifference: 0 },
      betterVsBest: { priceDifference: 0, percentDifference: 0 },
      goodVsBest: { priceDifference: 0, percentDifference: 0 },
    }
  }

  const good = options[0]!
  const better = options.length > 1 ? options[1]! : null
  const best = options.length > 2 ? options[2]! : null

  return {
    goodVsBetter: better ? {
      priceDifference: better.subtotal - good.subtotal,
      percentDifference: better.subtotal > 0 
        ? Math.round(((better.subtotal - good.subtotal) / good.subtotal) * 100)
        : 0,
    } : { priceDifference: 0, percentDifference: 0 },
    
    betterVsBest: better && best ? {
      priceDifference: best.subtotal - better.subtotal,
      percentDifference: better.subtotal > 0
        ? Math.round(((best.subtotal - better.subtotal) / better.subtotal) * 100)
        : 0,
    } : { priceDifference: 0, percentDifference: 0 },
    
    goodVsBest: best ? {
      priceDifference: best.subtotal - good.subtotal,
      percentDifference: good.subtotal > 0
        ? Math.round(((best.subtotal - good.subtotal) / good.subtotal) * 100)
        : 0,
    } : { priceDifference: 0, percentDifference: 0 },
  }
}

export interface OptionSavingsAnalysis {
  goodVsBetter: {
    priceDifference: number
    percentDifference: number
  }
  betterVsBest: {
    priceDifference: number
    percentDifference: number
  }
  goodVsBest: {
    priceDifference: number
    percentDifference: number
  }
}
