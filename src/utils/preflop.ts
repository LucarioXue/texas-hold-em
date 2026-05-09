// Pre-flop equity matrix: 13x13, ranks ordered A K Q J T 9 8 7 6 5 4 3 2
// Values are heads-up win probability against a single random hand
// Source: approximated from standard poker equity tables

import type { Card, Rank } from '../types'
import { rankValue } from './deck'

const RANK_INDEX: Record<string, number> = {
  'A': 0, 'K': 1, 'Q': 2, 'J': 3, 'T': 4,
  '9': 5, '8': 6, '7': 7, '6': 8, '5': 9, '4': 10, '3': 11, '2': 12,
}

// 13x13 matrix: [row][col] where row/col are rank indices A..2
// Diagonal = pairs, matrix[row][col] when row < col = suited, row > col = offsuit
const EQUITY: number[][] = [
  // A     K     Q     J     T     9     8     7     6     5     4     3     2
  [0.852,0.670,0.662,0.654,0.646,0.630,0.622,0.616,0.608,0.606,0.597,0.591,0.584], // A
  [0.653,0.824,0.634,0.626,0.618,0.601,0.592,0.584,0.576,0.572,0.564,0.558,0.551], // K
  [0.644,0.615,0.799,0.603,0.595,0.578,0.568,0.557,0.549,0.545,0.536,0.530,0.523], // Q
  [0.636,0.606,0.582,0.775,0.575,0.558,0.547,0.536,0.527,0.522,0.514,0.507,0.500], // J
  [0.628,0.598,0.574,0.554,0.751,0.541,0.530,0.519,0.510,0.504,0.496,0.489,0.482], // T
  [0.610,0.580,0.556,0.536,0.520,0.720,0.513,0.502,0.493,0.486,0.478,0.471,0.464], // 9
  [0.602,0.570,0.545,0.524,0.507,0.496,0.693,0.485,0.476,0.469,0.461,0.454,0.447], // 8
  [0.595,0.562,0.534,0.513,0.494,0.482,0.471,0.663,0.459,0.452,0.444,0.437,0.430], // 7
  [0.587,0.553,0.525,0.503,0.483,0.470,0.458,0.446,0.633,0.435,0.427,0.420,0.413], // 6
  [0.584,0.549,0.520,0.498,0.477,0.464,0.451,0.438,0.424,0.603,0.411,0.404,0.397], // 5
  [0.574,0.540,0.511,0.489,0.468,0.454,0.441,0.428,0.414,0.400,0.572,0.388,0.381], // 4
  [0.568,0.534,0.504,0.482,0.461,0.447,0.434,0.421,0.407,0.393,0.378,0.539,0.365], // 3
  [0.560,0.526,0.497,0.474,0.453,0.439,0.426,0.413,0.399,0.385,0.370,0.355,0.503], // 2
]

function getEquity(r1: Rank, r2: Rank): number {
  const i = RANK_INDEX[r1]
  const j = RANK_INDEX[r2]
  if (i === undefined || j === undefined) return 0
  return EQUITY[i][j]
}

/**
 * Heads-up equity for a given pair of hole cards.
 */
export function getHeadsUpEquity(c1: Card, c2: Card): number {
  if (c1.rank === c2.rank) {
    // Pair — diagonal
    return getEquity(c1.rank, c1.rank)
  }

  const i = RANK_INDEX[c1.rank]
  const j = RANK_INDEX[c2.rank]

  if (c1.suit === c2.suit) {
    // Suited — upper triangle (i < j)
    return i < j ? EQUITY[i][j] : EQUITY[j][i]
  }
  // Offsuit — lower triangle (i > j)
  return i < j ? EQUITY[j][i] : EQUITY[i][j]
}

/**
 * Adjust heads-up equity for N players.
 * Approximate: equity(N) ≈ equity(HU)^(N-1)
 */
export function getPreflopEquity(c1: Card, c2: Card, playerCount: number): number {
  const hu = getHeadsUpEquity(c1, c2)
  if (playerCount <= 2) return hu
  return Math.pow(hu, playerCount - 1)
}

/** Emotional commentary based on pre-flop equity */
export function getPreflopComment(c1: Card, c2: Card, equity: number): string {
  const r1 = rankValue(c1.rank)
  const r2 = rankValue(c2.rank)
  const high = r1 >= r2 ? c1.rank : c2.rank
  const low = r1 >= r2 ? c2.rank : c1.rank
  const suited = c1.suit === c2.suit ? 's' : 'o'
  const pair = c1.rank === c2.rank
  const name = pair ? `${high}${high}` : `${high}${low}${suited}`

  if (equity >= 0.50) {
    if (name === 'AA' || name === 'KK') return `${name} — 绝对坚果，建议强力加注`
    if (name === 'QQ' || name === 'JJ' || name === 'TT') return `${name} — 顶级强牌，值得 3-bet`
    if (name === 'AKs' || name === 'AKo') return `${name} — 超级强牌，积极进攻`
    if (equity >= 0.45) return `${name} — 强牌，有利位置可以加注`
    if (equity >= 0.40) return `${name} — 中等偏强，谨慎操作`
    return `${name} — 边缘牌，位置合适可入池`
  }
  if (equity >= 0.25) {
    if (pair) return `${name} — 中小对子，看翻牌碰运气`
    if (equity >= 0.35) return `${name} — 投机牌，翻后玩法关键`
    return `${name} — 需要极佳位置才考虑入池`
  }
  if (equity >= 0.15) {
    if (name === '72o') return `${name} — 毫无操作空间，建议光速弃牌`
    return `${name} — 垃圾牌，除非大盲否则果断弃`
  }
  return `${name} — 极其危险，果断弃牌保平安`
}
