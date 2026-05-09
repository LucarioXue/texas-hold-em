import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Card, GameState, GameAction, ActiveSlot, Suit, Rank } from '../types'

const initialHoleCards: [null, null] = [null, null]
const initialCommunityCards: [null, null, null, null, null] = [null, null, null, null, null]

const initialState: GameState = {
  playerCount: 6,
  holeCards: initialHoleCards,
  communityCards: initialCommunityCards,
  activeSlot: { type: 'hole', index: 0 },
  selectedSuit: null,
  selectedRank: null,
  history: [],
}

function findNextEmpty(state: GameState): ActiveSlot | null {
  for (let i = 0; i < 2; i++) {
    if (!state.holeCards[i]) return { type: 'hole', index: i }
  }
  for (let i = 0; i < 5; i++) {
    if (!state.communityCards[i]) return { type: 'community', index: i }
  }
  return null
}

function cardExists(state: GameState, suit: string, rank: string): boolean {
  return state.holeCards.some(c => c?.suit === suit && c?.rank === rank)
    || state.communityCards.some(c => c?.suit === suit && c?.rank === rank)
}

function placeCard(state: GameState, suit: Suit, rank: Rank): GameState {
  if (!state.activeSlot || cardExists(state, suit, rank)) return state

  const card: Card = { suit, rank }
  const updated = { ...state, history: [...state.history, state.activeSlot] }

  if (state.activeSlot.type === 'hole') {
    const holeCards = [...state.holeCards] as typeof state.holeCards
    holeCards[state.activeSlot.index] = card
    updated.holeCards = holeCards
  } else {
    const communityCards = [...state.communityCards] as typeof state.communityCards
    communityCards[state.activeSlot.index] = card
    updated.communityCards = communityCards
  }

  updated.activeSlot = findNextEmpty(updated)
  updated.selectedSuit = null
  updated.selectedRank = null
  return updated
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYER_COUNT':
      return { ...state, playerCount: Math.min(9, Math.max(2, action.count)) }

    case 'SELECT_SUIT': {
      if (!state.activeSlot) return state
      if (state.selectedRank) {
        return placeCard(state, action.suit, state.selectedRank)
      }
      return { ...state, selectedSuit: action.suit, selectedRank: null }
    }

    case 'SELECT_RANK': {
      if (!state.activeSlot) return state
      if (state.selectedSuit) {
        return placeCard(state, state.selectedSuit, action.rank)
      }
      return { ...state, selectedRank: action.rank, selectedSuit: null }
    }

    case 'SET_ACTIVE_SLOT':
      return { ...state, activeSlot: action.slot, selectedSuit: null, selectedRank: null }

    case 'UNDO': {
      if (state.history.length === 0) return state
      const newHistory = [...state.history]
      const lastSlot = newHistory.pop()!

      const updated = { ...state, history: newHistory, selectedSuit: null, selectedRank: null }

      if (lastSlot.type === 'hole') {
        const holeCards = [...state.holeCards] as typeof state.holeCards
        holeCards[lastSlot.index] = null
        updated.holeCards = holeCards
      } else {
        const communityCards = [...state.communityCards] as typeof state.communityCards
        communityCards[lastSlot.index] = null
        updated.communityCards = communityCards
      }

      updated.activeSlot = lastSlot
      return updated
    }

    case 'CLEAR_ALL':
      return { ...initialState, playerCount: state.playerCount }

    default:
      return state
  }
}

const GameContext = createContext<GameState | null>(null)
const GameDispatch = createContext<React.Dispatch<GameAction> | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <GameContext.Provider value={state}>
      <GameDispatch.Provider value={dispatch}>
        {children}
      </GameDispatch.Provider>
    </GameContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameState must be used within GameProvider')
  return ctx
}

export function useGameDispatch() {
  const ctx = useContext(GameDispatch)
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider')
  return ctx
}
