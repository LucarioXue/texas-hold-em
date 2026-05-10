import { useGameState, useGameDispatch } from '../context/GameContext'
import type { Suit, Rank } from '../types'
import { Trash2, Undo2 } from 'lucide-react'

const SUITS: { value: Suit; symbol: string; color: string }[] = [
  { value: 's', symbol: '♠', color: 'text-white' },
  { value: 'h', symbol: '♥', color: 'text-red-500' },
  { value: 'd', symbol: '♦', color: 'text-red-500' },
  { value: 'c', symbol: '♣', color: 'text-green-400' },
]

const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

export default function PokerKeyboard() {
  const { selectedSuit, selectedRank, activeSlot } = useGameState()
  const dispatch = useGameDispatch()
  const noSlot = !activeSlot

  return (
    <div className="grid grid-cols-[1fr_4fr] gap-3 h-56">
      {/* Suit column */}
      <div className="grid grid-rows-4 gap-2">
        {SUITS.map(({ value, symbol, color }) => {
          const selected = selectedSuit === value
          return (
            <button
              key={value}
              onClick={() => dispatch({ type: 'SELECT_SUIT', suit: value })}
              disabled={noSlot}
              className={`${color} text-3xl h-full rounded-xl font-medium
                transition-all duration-100 active:scale-95
                disabled:opacity-30 disabled:cursor-not-allowed
                ${selected
                  ? 'bg-gold/20 border border-gold/50 shadow-[0_0_12px_rgba(197,165,90,0.3)]'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
                }`}
            >
              {symbol}
            </button>
          )
        })}
      </div>

      {/* Rank grid */}
      <div className="grid grid-cols-4 grid-rows-4 gap-2">
        {RANKS.slice(0, 12).map(rank => {
          const selected = selectedRank === rank
          return (
            <button
              key={rank}
              onClick={() => dispatch({ type: 'SELECT_RANK', rank })}
              disabled={noSlot}
              className={`bg-white/5 border border-white/10 rounded-lg text-white text-lg font-bold
                transition-all duration-100 active:scale-95
                hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                ${selected
                  ? 'bg-gold/20 !border-gold/50 shadow-[0_0_12px_rgba(197,165,90,0.3)]'
                  : ''
                }`}
            >
              {rank}
            </button>
          )
        })}

        {/* A + 清空 + 撤销 */}
        {(() => {
          const aSelected = selectedRank === 'A'
          return (
            <button
              onClick={() => dispatch({ type: 'SELECT_RANK', rank: 'A' })}
              disabled={noSlot}
              className={`bg-white/5 border border-white/10 rounded-lg text-white text-lg font-bold
                transition-all duration-100 active:scale-95
                hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                ${aSelected
                  ? 'bg-gold/20 !border-gold/50 shadow-[0_0_12px_rgba(197,165,90,0.3)]'
                  : ''
                }`}
            >
              A
            </button>
          )
        })()}

        <button
          onClick={() => dispatch({ type: 'CLEAR_ALL' })}
          className="flex items-center justify-center gap-0.5 bg-white/5 border border-white/10 rounded-lg text-white/40 text-xs font-bold
            transition-all duration-100 active:scale-95 hover:bg-white/10 hover:text-white/60"
        >
          <Trash2 size={14} strokeWidth={2} />
          <span>清空</span>
        </button>

        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          className="flex items-center justify-center gap-0.5 bg-white/5 border border-white/10 rounded-lg text-white/40 text-xs font-bold
            transition-all duration-100 active:scale-95 hover:bg-white/10 hover:text-white/60"
        >
          <Undo2 size={14} strokeWidth={2} />
          <span>撤销</span>
        </button>

        <div />
      </div>
    </div>
  )
}
