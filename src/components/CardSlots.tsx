import { useGameState, useGameDispatch } from '../context/GameContext'
import CardSlot from './CardSlot'

const COMMUNITY_LABELS = ['翻牌1', '翻牌2', '翻牌3', '转牌', '河牌']

export default function CardSlots() {
  const { holeCards, communityCards, activeSlot } = useGameState()
  const dispatch = useGameDispatch()

  const isActive = (type: 'hole' | 'community', index: number) =>
    activeSlot?.type === type && activeSlot.index === index

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

      {/* Hole cards — below */}
      <div className="flex gap-3">
        <CardSlot
          card={holeCards[0]}
          isActive={isActive('hole', 0)}
          label="底牌1"
          onClick={() => dispatch({ type: 'SET_ACTIVE_SLOT', slot: { type: 'hole', index: 0 } })}
        />
        <CardSlot
          card={holeCards[1]}
          isActive={isActive('hole', 1)}
          label="底牌2"
          onClick={() => dispatch({ type: 'SET_ACTIVE_SLOT', slot: { type: 'hole', index: 1 } })}
        />
      </div>
    </div>
  )
}
