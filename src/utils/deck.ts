import type { Card, Suit, Rank } from '../types'

export const SUITS: Suit[] = ['s', 'h', 'd', 'c']
export const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','T','J','Q','K','A']

const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

export function rankValue(r: Rank): number {
  return RANK_VALUE[r]
}

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank })
    }
  }
  return deck
}

export function cardKey(c: Card): string {
  return `${c.suit}${c.rank}`
}

export function removeCards(deck: Card[], toRemove: Card[]): Card[] {
  const removeKeys = new Set(toRemove.map(cardKey))
  return deck.filter(c => !removeKeys.has(cardKey(c)))
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function suitSymbol(suit: Suit): string {
  return { s: '♠', h: '♥', d: '♦', c: '♣' }[suit]
}
