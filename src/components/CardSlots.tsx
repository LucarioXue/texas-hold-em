import { useState } from 'react'
import { useGameState, useGameDispatch } from '../context/GameContext'
import CardSlot from './CardSlot'
import { Eye, EyeOff } from 'lucide-react'

const COMMUNITY_LABELS = ['翻牌1', '翻牌2', '翻牌3', '转牌', '河牌']

export default function CardSlots() {
  const { holeCards, communityCards, activeSlot } = useGameState()
  const dispatch = useGameDispatch()
  const [showHoleCards, setShowHoleCards] = useState(true)

  const isActive = (type: 'hole' | 'community', index: number) =>
    activeSlot?.type === type && activeSlot.index === index

  const hasHoleCards = holeCards[0] !== null || holeCards[1] !== null

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Community cards — on top */}
      <div className="flex gap-2.5">
        {communityCards.map((card, i) => (
          <CardSlot
            key={i}
            card={card}
            isActive={isActive('community', i)}
            label={COMMUNITY_LABELS[i]}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SLOT', slot: { type: 'community', index: i } })}
          />
        ))}
      </div>

      {/* Hole cards — below, with privacy toggle */}
      <div className="flex items-center gap-3">
        <CardSlot
          card={holeCards[0]}
          isActive={isActive('hole', 0)}
          label="底牌1"
          onClick={() => dispatch({ type: 'SET_ACTIVE_SLOT', slot: { type: 'hole', index: 0 } })}
          hidden={!showHoleCards}
        />
        <CardSlot
          card={holeCards[1]}
          isActive={isActive('hole', 1)}
          label="底牌2"
          onClick={() => dispatch({ type: 'SET_ACTIVE_SLOT', slot: { type: 'hole', index: 1 } })}
          hidden={!showHoleCards}
        />

        {hasHoleCards && (
          <button
            onClick={() => setShowHoleCards(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              bg-white/5 border border-white/10 text-white/30
              hover:text-white/60 hover:bg-white/10 transition-all duration-150 active:scale-90"
            title={showHoleCards ? '隐藏底牌' : '显示底牌'}
          >
            {showHoleCards ? <Eye size={16} strokeWidth={2} /> : <EyeOff size={16} strokeWidth={2} />}
          </button>
        )}
      </div>
    </div>
  )
}
