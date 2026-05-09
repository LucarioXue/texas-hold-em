export type Suit = 's' | 'h' | 'd' | 'c'

export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
}

export type SlotType = 'hole' | 'community'

export interface ActiveSlot {
  type: SlotType
  index: number
}

export interface GameState {
  playerCount: number
  holeCards: [Card | null, Card | null]
  communityCards: [Card | null, Card | null, Card | null, Card | null, Card | null]
  activeSlot: ActiveSlot | null
  selectedSuit: Suit | null
  selectedRank: Rank | null
  history: ActiveSlot[]
}

export type GameAction =
  | { type: 'SET_PLAYER_COUNT'; count: number }
  | { type: 'SELECT_SUIT'; suit: Suit }
  | { type: 'SELECT_RANK'; rank: Rank }
  | { type: 'SET_ACTIVE_SLOT'; slot: ActiveSlot }
  | { type: 'UNDO' }
  | { type: 'CLEAR_ALL' }
