import { useMemo } from 'react'
import { useGameState } from '../context/GameContext'
import GlassPanel from './GlassPanel'
import { getPreflopEquity, getPreflopComment } from '../utils/preflop'
import { runSimulation } from '../utils/montecarlo'
import { detectOuts } from '../utils/outs'
import type { Card } from '../types'
import { TrendingUp, BarChart3 } from 'lucide-react'

export default function DecisionPanel() {
  const { holeCards, communityCards, playerCount } = useGameState()
  const holeFilled = holeCards.every(c => c !== null)
  const commFilled = communityCards.filter(c => c !== null) as Card[]
  const stage = commFilled.length >= 3 ? 'postflop' : 'preflop'

  const stageLabel = commFilled.length >= 5 ? '河牌圈'
    : commFilled.length === 4 ? '转牌圈'
    : commFilled.length === 3 ? '翻牌圈'
    : '翻牌前'

  // Stable key so useMemo only recalculates when cards actually change
  const calcKey = useMemo(() => {
    if (!holeFilled) return ''
    const h = holeCards as [Card, Card]
    return `${h[0].suit}${h[0].rank}-${h[1].suit}${h[1].rank}|${commFilled.map(c => `${c.suit}${c.rank}`).join(',')}|${playerCount}`
  }, [holeCards, communityCards, playerCount, holeFilled, commFilled])

  const analysis = useMemo(() => {
    if (!holeFilled) return null
    const h = holeCards as [Card, Card]

    if (stage === 'preflop') {
      const equity = getPreflopEquity(h[0], h[1], playerCount)
      const comment = getPreflopComment(h[0], h[1], equity)
      return { equity, comment, outsInfo: null, handDistribution: null }
    }

    // Post-flop: Monte Carlo + outs
    const result = runSimulation(h, commFilled, playerCount, 4000)
    const outsInfo = commFilled.length < 5 ? detectOuts(h, commFilled) : null
    return {
      equity: result.winRate,
      tieRate: result.tieRate,
      comment: null,
      outsInfo: outsInfo?.type !== 'none' ? outsInfo : null,
      handDistribution: result.handDistribution,
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calcKey])

  if (!analysis) {
    return (
      <GlassPanel className="px-4 py-4 text-center">
        <p className="text-white/30 text-sm">录入底牌后显示胜率分析</p>
      </GlassPanel>
    )
  }

  const winPct = (analysis.equity * 100).toFixed(1)
  const isHigh = analysis.equity >= 0.55
  const isMid = analysis.equity >= 0.35

  return (
    <GlassPanel className="px-4 py-4">
      {/* Win rate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-white/50 text-xs font-medium tracking-wider uppercase">
            <TrendingUp size={14} strokeWidth={2} />
            胜率估算
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold font-medium">
            {stageLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold tabular-nums ${
            isHigh ? 'text-vivid-green' : isMid ? 'text-gold' : 'text-red-400'
          }`}>
            {winPct}%
          </span>
          {'tieRate' in analysis && (analysis.tieRate ?? 0) > 0.01 && (
            <span className="text-white/30 text-xs tabular-nums">
              平 {((analysis.tieRate ?? 0) * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? 'bg-vivid-green' : isMid ? 'bg-gold' : 'bg-red-400'
          }`}
          style={{ width: `${Math.max(analysis.equity * 100, 2)}%` }}
        />
      </div>

      {/* Commentary / Outs */}
      {stage === 'preflop' && analysis.comment && (
        <p className="mt-3 text-white/60 text-xs leading-relaxed">
          {analysis.comment}
        </p>
      )}

      {analysis.outsInfo && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-neon-blue font-medium">
            {analysis.outsInfo.type === 'flush' && '同花听牌'}
            {analysis.outsInfo.type === 'oesd' && '两头顺听牌'}
            {analysis.outsInfo.type === 'gutshot' && '卡顺听牌'}
            {analysis.outsInfo.type === 'combo' && '组合听牌'}
          </span>
          <span className="text-white/40">
            {analysis.outsInfo.outs} 张 Outs · 下轮约 {(analysis.outsInfo.outs * 2).toFixed(0)}%
          </span>
        </div>
      )}

      {/* Hand type distribution */}
      {analysis.handDistribution && (
        <div className="mt-3 space-y-1">
          <span className="flex items-center gap-1 text-white/50 text-[10px] font-medium tracking-wider uppercase">
            <BarChart3 size={12} strokeWidth={2} />
            牌型分布
          </span>
          {analysis.handDistribution.map(({ name, probability }) => {
            const pct = (probability * 100).toFixed(1)
            const isZero = probability < 0.0005
            return (
              <div key={name} className="flex items-center gap-2">
                <span className="text-white/40 text-[10px] w-10 shrink-0">{name}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold/40 transition-all duration-500"
                    style={{ width: `${Math.max(probability * 100, isZero ? 0 : 0.5)}%` }}
                  />
                </div>
                <span className={`text-[10px] tabular-nums w-10 text-right shrink-0 ${isZero ? 'text-white/15' : 'text-white/30'}`}>
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Iterations label */}
      {stage === 'postflop' && (
        <p className="mt-2 text-white/20 text-[10px]">
          基于 {playerCount} 人局 4000 次蒙特卡洛模拟
        </p>
      )}
    </GlassPanel>
  )
}
