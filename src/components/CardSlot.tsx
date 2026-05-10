import type { Card } from '../types'

const SUIT_SYMBOL: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
const SUIT_COLOR: Record<string, string> = {
  s: 'text-white',
  h: 'text-red-400',
  d: 'text-neon-blue',
  c: 'text-emerald-300',
}

export default function CardSlot({
  card,
  isActive,
  label,
  onClick,
}: {
  card: Card | null
  isActive: boolean
  label?: string
  onClick: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`w-12 h-16 rounded-lg border font-bold transition-all duration-150 active:scale-95
          ${card
            ? 'bg-white/10 border-white/20'
            : 'bg-white/[0.03] border-white/10 border-dashed'
          }
          ${isActive ? 'ring-2 ring-gold shadow-[0_0_12px_rgba(197,165,90,0.3)]' : ''}
        `}
      >
        {card ? (
          <div className="flex flex-col items-center justify-center h-full">
            <span className={`text-xl leading-none ${SUIT_COLOR[card.suit]}`}>
              {SUIT_SYMBOL[card.suit]}
            </span>
            <span className="text-white text-sm font-bold leading-none mt-0.5">
              {card.rank}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center justify-center h-full text-white/15 text-lg"
            style={{ animation: 'slot-pulse 2s ease-in-out infinite' }}
          >+</div>
        )}
      </button>
      {label && (
        <span className="text-white/25 text-[10px] font-medium">{label}</span>
      )}
    </div>
  )
}
