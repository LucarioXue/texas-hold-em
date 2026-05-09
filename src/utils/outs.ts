import type { Card } from '../types'
import { rankValue } from './deck'

export interface OutsInfo {
  type: 'flush' | 'oesd' | 'gutshot' | 'combo' | 'none'
  outs: number
  description: string
}

const STRAIGHTS: { ranks: Set<number>; high: number }[] = [
  [14, 13, 12, 11, 10],
  [13, 12, 11, 10, 9],
  [12, 11, 10, 9, 8],
  [11, 10, 9, 8, 7],
  [10, 9, 8, 7, 6],
  [9, 8, 7, 6, 5],
  [8, 7, 6, 5, 4],
  [7, 6, 5, 4, 3],
  [6, 5, 4, 3, 2],
  [14, 5, 4, 3, 2],    // wheel
].map(ranks => ({ ranks: new Set(ranks), high: ranks[0] }))

const RANK_NAMES = ['', '', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

export function detectOuts(holeCards: [Card, Card], communityCards: Card[]): OutsInfo {
  const allCards = [...holeCards, ...communityCards]
  const rankSet = new Set(allCards.map(c => rankValue(c.rank)))

  // Flush draw: 4 cards of same suit
  const suitCounts = new Map<string, number>()
  for (const c of allCards) suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1)
  let flushSuit: string | null = null
  for (const [s, n] of suitCounts) { if (n === 4) { flushSuit = s; break } }

  let flushOuts = 0
  if (flushSuit) {
    flushOuts = 13 - allCards.filter(c => c.suit === flushSuit).length
  }

  // Straight draw: find any straight missing exactly 1 rank
  let bestDraw: { oesd: boolean; desc: string } | null = null

  for (const st of STRAIGHTS) {
    const missing: number[] = []
    for (const r of st.ranks) { if (!rankSet.has(r)) missing.push(r) }
    if (missing.length !== 1) continue

    const miss = missing[0]
    const isWheel = st.ranks.has(14) && st.ranks.has(2)
    const oesd = isWheel
      ? (miss === 14 || miss === 2)
      : (miss === Math.min(...st.ranks) || miss === Math.max(...st.ranks))

    // Prefer OESD over gutshot
    if (!bestDraw || (oesd && !bestDraw.oesd)) {
      const desc = oesd
        ? `${RANK_NAMES[st.high]}高两头抽顺`
        : `卡顺听牌（缺${RANK_NAMES[miss]}）`
      bestDraw = { oesd, desc }
    }
  }

  // Build result
  if (flushSuit && bestDraw) {
    const sOuts = bestDraw.oesd ? 8 : 4
    return {
      type: 'combo',
      outs: flushOuts + sOuts,
      description: `同花听牌（${flushOuts}张补牌）+ ${bestDraw.desc}`,
    }
  }

  if (flushSuit) {
    return { type: 'flush', outs: flushOuts, description: `同花听牌，有 ${flushOuts} 张补牌` }
  }

  if (bestDraw) {
    const outs = bestDraw.oesd ? 8 : 4
    return { type: bestDraw.oesd ? 'oesd' : 'gutshot', outs, description: `${bestDraw.desc}，有 ${outs} 张补牌` }
  }

  return { type: 'none', outs: 0, description: '' }
}

export function outsToProbability(outs: number): number {
  return Math.min(outs * 0.02, 0.99)
}
