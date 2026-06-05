import type { Card } from '../types'
import { createDeck, removeCards, shuffle, cardKey } from './deck'
import { evaluate7, getHandType, handTypeLabel } from './evaluator'

export interface HandTypeDist {
  name: string
  probability: number
}

export interface SimulationResult {
  winRate: number
  tieRate: number
  iterations: number
  handDistribution: HandTypeDist[]
}

/**
 * Exact enumeration for the river card (when only 1 community card remains).
 *
 * Enumerates all 44 possible river cards exactly, while opponent hole cards
 * are sampled randomly from the remaining deck per river card.
 */
function runRiverExact(
  holeCards: [Card, Card],
  communityCards: Card[],
  playerCount: number,
): SimulationResult {
  const knownCards = [...holeCards, ...communityCards]
  const remainingCards = removeCards(createDeck(), knownCards) // exactly 44 cards
  const opponentCount = playerCount - 1

  // Opponent samples per river card: more for fewer opponents
  const samplesPerRiver = opponentCount <= 2 ? 200 : 100
  const totalTrials = remainingCards.length * samplesPerRiver

  let wins = 0
  let ties = 0
  const handTypeCounts = new Array<number>(10).fill(0)

  for (const riverCard of remainingCards) {
    const allCommunity = [...communityCards, riverCard]

    // Hero hand is exact for this river card
    const heroScore = evaluate7([...holeCards, ...allCommunity])
    handTypeCounts[getHandType(heroScore)]++

    // Sample opponent hole cards from the remaining deck (excluding the river card)
    const riverKey = cardKey(riverCard)
    const deckWithoutRiver = remainingCards.filter(c => cardKey(c) !== riverKey)

    for (let s = 0; s < samplesPerRiver; s++) {
      const shuffled = shuffle(deckWithoutRiver)
      let takeIdx = 0
      let bestOpponentScore = -1

      for (let opp = 0; opp < opponentCount; opp++) {
        const oppCards = [shuffled[takeIdx++], shuffled[takeIdx++]]
        const oppScore = evaluate7([...oppCards, ...allCommunity])
        if (oppScore > bestOpponentScore) bestOpponentScore = oppScore
      }

      if (heroScore > bestOpponentScore) {
        wins++
      } else if (heroScore === bestOpponentScore) {
        ties++
      }
    }
  }

  const handDistribution: HandTypeDist[] = []
  for (let type = 9; type >= 1; type--) {
    handDistribution.push({
      name: handTypeLabel(type),
      probability: handTypeCounts[type] / remainingCards.length,
    })
  }

  return {
    winRate: wins / totalTrials,
    tieRate: ties / totalTrials,
    iterations: totalTrials,
    handDistribution,
  }
}

/**
 * Run Monte Carlo simulation to estimate win/tie probabilities.
 *
 * Automatically switches to exact river-card enumeration when only 1
 * community card remains (turn → river), since there are only 44 unknown
 * cards.
 *
 * @param holeCards - Hero's 2 hole cards
 * @param communityCards - Known community cards (3 for flop, 4 for turn, 5 for river)
 * @param playerCount - Total players remaining in the hand
 * @param iterations - Number of random deals to simulate (default 4000, ignored for exact mode)
 */
export function runSimulation(
  holeCards: [Card, Card],
  communityCards: Card[],
  playerCount: number,
  iterations = 4000,
): SimulationResult {
  const communityNeeded = 5 - communityCards.length

  // When only the river remains, enumerate all 44 river cards exactly
  if (communityNeeded === 1) {
    return runRiverExact(holeCards, communityCards, playerCount)
  }

  const knownCards = [...holeCards, ...communityCards]
  const baseDeck = removeCards(createDeck(), knownCards)
  const opponentCount = playerCount - 1

  let wins = 0
  let ties = 0
  const handTypeCounts = new Array<number>(10).fill(0)

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
    handTypeCounts[getHandType(heroScore)]++

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

  const handDistribution: HandTypeDist[] = []
  for (let type = 9; type >= 1; type--) {
    handDistribution.push({
      name: handTypeLabel(type),
      probability: handTypeCounts[type] / iterations,
    })
  }

  return {
    winRate: wins / iterations,
    tieRate: ties / iterations,
    iterations,
    handDistribution,
  }
}
