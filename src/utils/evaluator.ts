import type { Card } from '../types'
import { rankValue } from './deck'

// Hand type constants (higher = stronger)
const STRAIGHT_FLUSH = 9
const FOUR_KIND = 8
const FULL_HOUSE = 7
const FLUSH = 6
const STRAIGHT = 5
const THREE_KIND = 4
const TWO_PAIR = 3
const ONE_PAIR = 2
const HIGH_CARD = 1

// 21 ways to choose 5 from 7 (precomputed indices)
const C75 = [
  [0,1,2,3,4],[0,1,2,3,5],[0,1,2,3,6],[0,1,2,4,5],[0,1,2,4,6],
  [0,1,2,5,6],[0,1,3,4,5],[0,1,3,4,6],[0,1,3,5,6],[0,1,4,5,6],
  [0,2,3,4,5],[0,2,3,4,6],[0,2,3,5,6],[0,2,4,5,6],[0,3,4,5,6],
  [1,2,3,4,5],[1,2,3,4,6],[1,2,3,5,6],[1,2,4,5,6],[1,3,4,5,6],
  [2,3,4,5,6],
]

/**
 * Encode hand as a numeric score: handType * 15^5 + k1 * 15^4 + ... + k5
 * Higher score = stronger hand. Base 15 ensures no overlap between kicker slots.
 */
function score(type: number, ...kickers: number[]): number {
  let s = type
  for (const k of kickers) {
    s = s * 15 + k
  }
  // Pad remaining slots with 0
  for (let i = kickers.length; i < 5; i++) {
    s = s * 15
  }
  return s
}

function isStraight(ranks: number[]): boolean {
  if (isWheel(ranks)) return true
  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i - 1] - ranks[i] !== 1) return false
  }
  return true
}

// Check wheel: ranks [14,5,4,3,2]
function isWheel(ranks: number[]): boolean {
  return ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2
}

function straightHigh(ranks: number[]): number[] {
  // Handle wheel: A-2-3-4-5 → high card is 5
  if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
    return [5]
  }
  return [ranks[0]]
}

/**
 * Evaluate exactly 5 cards, return numeric score (higher = stronger).
 */
export function evaluate5(cards: Card[]): number {
  const r = cards.map(c => rankValue(c.rank)).sort((a, b) => b - a)
  const suits = cards.map(c => c.suit)

  const flush = suits.every(s => s === suits[0])
  const straight = isStraight(r)

  // Count frequencies
  const freq = new Map<number, number>()
  for (const v of r) freq.set(v, (freq.get(v) || 0) + 1)
  const groups = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])

  if (flush && straight) {
    return score(STRAIGHT_FLUSH, ...straightHigh(r), 0, 0, 0, 0)
  }
  if (groups[0][1] === 4) {
    return score(FOUR_KIND, groups[0][0], groups[1][0], 0, 0, 0)
  }
  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return score(FULL_HOUSE, groups[0][0], groups[1][0], 0, 0, 0)
  }
  if (flush) {
    return score(FLUSH, ...r)
  }
  if (straight) {
    return score(STRAIGHT, ...straightHigh(r), 0, 0, 0, 0)
  }
  if (groups[0][1] === 3) {
    return score(THREE_KIND, groups[0][0], groups[1][0], groups[2][0], 0, 0)
  }
  if (groups[0][1] === 2 && groups[1][1] === 2) {
    return score(TWO_PAIR, groups[0][0], groups[1][0], groups[2][0], 0, 0)
  }
  if (groups[0][1] === 2) {
    return score(ONE_PAIR, groups[0][0], groups[1][0], groups[2][0], groups[3][0], 0)
  }
  return score(HIGH_CARD, ...r)
}

/**
 * Evaluate 7 cards (2 hole + 5 community), return best 5-card score.
 */
export function evaluate7(cards: Card[]): number {
  let best = 0
  for (const idx of C75) {
    const s = evaluate5([cards[idx[0]], cards[idx[1]], cards[idx[2]], cards[idx[3]], cards[idx[4]]])
    if (s > best) best = s
  }
  return best
}

export function handTypeName(scoreVal: number): string {
  const type = Math.floor(scoreVal / (15 ** 5))
  const names: Record<number, string> = {
    [STRAIGHT_FLUSH]: '同花顺',
    [FOUR_KIND]: '四条',
    [FULL_HOUSE]: '葫芦',
    [FLUSH]: '同花',
    [STRAIGHT]: '顺子',
    [THREE_KIND]: '三条',
    [TWO_PAIR]: '两对',
    [ONE_PAIR]: '一对',
    [HIGH_CARD]: '高牌',
  }
  return names[type] || '未知'
}
