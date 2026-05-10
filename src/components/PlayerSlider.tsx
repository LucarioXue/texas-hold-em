import { useGameState, useGameDispatch } from '../context/GameContext'
import GlassPanel from './GlassPanel'
import { Users } from 'lucide-react'

export default function PlayerSlider() {
  const { playerCount } = useGameState()
  const dispatch = useGameDispatch()

  return (
    <GlassPanel className="px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1 text-white/50 text-xs font-medium tracking-wider uppercase">
          <Users size={14} strokeWidth={2} />
          牌局人数
        </span>
        <span className="text-gold text-2xl font-bold tabular-nums">
          {playerCount}
          <span className="text-white/40 text-sm font-normal ml-0.5">人</span>
        </span>
      </div>
      <input
        type="range"
        min="2"
        max="9"
        step="1"
        value={playerCount}
        onChange={e => dispatch({ type: 'SET_PLAYER_COUNT', count: Number(e.target.value) })}
        className="w-full"
      />
      <div className="flex justify-between text-white/25 text-[10px] font-medium mt-0.5 px-0.5">
        <span>2</span><span>3</span><span>4</span><span>5</span>
        <span>6</span><span>7</span><span>8</span><span>9</span>
      </div>
    </GlassPanel>
  )
}
