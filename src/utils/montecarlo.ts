import type { Card } from '../types'
import { createDeck, removeCards, shuffle } from './deck'
import { evaluate7 } from './evaluator'

export interface SimulationResult {
  winRate: number
  tieRate: number
  iterations: number
}

/**
 * Run Monte Carlo simulation to estimate win/tie probabilities.
 *
 * @param holeCards - Hero's 2 hole cards
 * @param communityCards - Known community cards (3 for flop, 4 for turn, 5 for river)
 * @param playerCount - Total players remaining in the hand
 * @param iterations - Number of random deals to simulate (default 4000)
 */
export function runSimulation(
  holeCards: [Card, Card],
  communityCards: Card[],
  playerCount: number,
  iterations = 4000,
): SimulationResult {
  const knownCards = [...holeCards, ...communityCards]
  const baseDeck = removeCards(createDeck(), knownCards)
  const communityNeeded = 5 - communityCards.length
  const opponentCount = playerCount - 1

  let wins = 0
  let ties = 0

  for (let i = 0; i < iterations; i++) {
    const deck = shuffle(baseDeck)

    // Deal remaining community cards
    let takeIdx = 0
    const remainingCommunity: Card[] = []
    for (let c = 0; c < communityNeeded; c++) {
      remainingCommunity.push(deck[takeIdx++])
    }

    const allCommunity = [...communityCards, ...remainingCommunity]

    // Evaluate hero
    const heroHand = [...holeCards, ...allCommunity]
    const heroScore = evaluate7(heroHand)

    // Evaluate each opponent, track best opponent score
    let bestOpponentScore = -1
    for (let opp = 0; opp < opponentCount; opp++) {
      const oppCards = [deck[takeIdx++], deck[takeIdx++]]
      const oppHand = [...oppCards, ...allCommunity]
      const oppScore = evaluate7(oppHand)
      if (oppScore > bestOpponentScore) bestOpponentScore = oppScore
    }

    if (heroScore > bestOpponentScore) {
      wins++
    } else if (heroScore === bestOpponentScore) {
      ties++
    }
  }

  return {
    winRate: wins / iterations,
    tieRate: ties / iterations,
    iterations,
  }
}
