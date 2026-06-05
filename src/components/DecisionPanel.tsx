import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useGameState } from '../context/GameContext'
import GlassPanel from './GlassPanel'
import ChipInput from './ChipInput'
import { getPreflopComment } from '../utils/preflop'
import { detectOuts } from '../utils/outs'
import { calcRequiredEquity, calcEV } from '../utils/ev'
import type { Card } from '../types'
import type { SimulationResult } from '../utils/montecarlo'
import { TrendingUp, BarChart3, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

interface Analysis {
  equity: number
  tieRate: number
  comment: string | null
  outsInfo: ReturnType<typeof detectOuts> | null
  handDistribution: SimulationResult['handDistribution'] | null
}

export default function DecisionPanel() {
  const { holeCards, communityCards, playerCount } = useGameState()
  const holeFilled = holeCards.every(c => c !== null)
  const commFilled = communityCards.filter(c => c !== null) as Card[]
  const stage = commFilled.length >= 3 ? 'postflop' : 'preflop'

  const stageLabel = commFilled.length >= 5 ? '河牌圈'
    : commFilled.length === 4 ? '转牌圈'
    : commFilled.length === 3 ? '翻牌圈'
    : '翻牌前'

  // ── Pot / Bet snapshot (local, not persisted across streets) ──
  const [pot, setPot] = useState(0)
  const [bet, setBet] = useState(0)

  // Debounce playerCount to avoid re-running simulation during slider drag
  const [analysisPlayerCount, setAnalysisPlayerCount] = useState(playerCount)
  useEffect(() => {
    const timer = setTimeout(() => setAnalysisPlayerCount(playerCount), 250)
    return () => clearTimeout(timer)
  }, [playerCount])

  const [detailExpanded, setDetailExpanded] = useState(false)

  // ── Web Worker for Monte Carlo ──
  const workerRef = useRef<Worker | null>(null)
  const requestIdRef = useRef(0)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [computing, setComputing] = useState(false)

  // Create worker once
  useEffect(() => {
    const w = new Worker(
      new URL('../simulation.worker.ts', import.meta.url),
      { type: 'module' },
    )
    w.onmessage = (e: MessageEvent<{ id: number; result: SimulationResult }>) => {
      const { id, result } = e.data
      // Ignore stale responses from outdated requests
      if (id !== requestIdRef.current) return

      const h = holeCardsRef.current as [Card, Card]
      const comm = commFilledRef.current

      if (comm.length >= 3) {
        // Post-flop: add outs on main thread (fast)
        const outsInfo = comm.length < 5 ? detectOuts(h, comm) : null
        setAnalysis({
          equity: result.winRate,
          tieRate: result.tieRate,
          comment: null,
          outsInfo: outsInfo?.type !== 'none' ? outsInfo : null,
          handDistribution: result.handDistribution,
        })
      } else {
        // Preflop: add comment on main thread (fast)
        setAnalysis({
          equity: result.winRate,
          tieRate: result.tieRate,
          comment: getPreflopComment(h[0], h[1], result.winRate),
          outsInfo: null,
          handDistribution: result.handDistribution,
        })
      }
      setComputing(false)
    }
    workerRef.current = w
    return () => w.terminate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep refs so the worker onmessage closure reads current values
  const holeCardsRef = useRef(holeCards)
  holeCardsRef.current = holeCards
  const commFilledRef = useRef(commFilled)
  commFilledRef.current = commFilled

  // Request simulation when inputs change
  const requestSimulation = useCallback(() => {
    if (!holeFilled) {
      setAnalysis(null)
      setComputing(false)
      return
    }
    const h = holeCards as [Card, Card]
    const id = ++requestIdRef.current
    setComputing(true)
    workerRef.current?.postMessage({
      id,
      holeCards: h,
      communityCards: stage === 'preflop' ? [] : commFilled,
      playerCount: analysisPlayerCount,
      iterations: 4000,
    })
  }, [holeFilled, holeCards, commFilled, stage, analysisPlayerCount])

  // Fire simulation when the calculation key changes
  const calcKey = useMemo(() => {
    if (!holeFilled) return ''
    const h = holeCards as [Card, Card]
    return `${h[0].suit}${h[0].rank}-${h[1].suit}${h[1].rank}|${commFilled.map(c => `${c.suit}${c.rank}`).join(',')}|${analysisPlayerCount}`
  }, [holeCards, communityCards, analysisPlayerCount, holeFilled, commFilled])

  useEffect(() => {
    requestSimulation()
  }, [calcKey, requestSimulation])

  // ── Pot Odds & EV (only when user has entered pot/bet) ──
  const potOdds = useMemo(() => {
    if (!analysis || bet <= 0) return null
    const required = calcRequiredEquity(pot, bet)
    const ev = calcEV(analysis.equity, pot, bet)
    return { required, ev }
  }, [analysis, pot, bet])

  // ── Empty state: no hole cards ──
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
    <GlassPanel className="px-4 py-4 space-y-3">
      {/* ═══ Decision Dashboard ═══ */}
      <div className="space-y-2">
        {/* Win-rate row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-white/50 text-xs font-medium tracking-wider uppercase">
              <TrendingUp size={14} strokeWidth={2} />
              胜率估算
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-gold font-medium">
              {stageLabel}
            </span>
            {computing && (
              <Loader2 size={12} strokeWidth={2} className="text-gold/50 animate-spin" />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold tabular-nums transition-opacity duration-150
              ${computing ? 'opacity-40' : ''} ${
              isHigh ? 'text-vivid-green' : isMid ? 'text-gold' : 'text-red-400'
            }`}>
              {winPct}%
            </span>
            {analysis.tieRate > 0.01 && (
              <span className="text-white/30 text-xs tabular-nums">
                平 {(analysis.tieRate * 100).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Odds vs required equity + EV verdict (only when bet > 0) */}
        {potOdds && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-3 text-xs">
              <div className="text-white/40">
                需要胜率
                <span className="ml-1 text-white/70 font-bold tabular-nums">
                  {(potOdds.required * 100).toFixed(1)}%
                </span>
              </div>
              <span className="text-white/15">|</span>
              <div>
                {potOdds.ev > 0 ? (
                  <span className="text-vivid-green font-bold">
                    ✓ +EV {potOdds.ev.toFixed(1)} BB
                  </span>
                ) : (
                  <span className="text-red-400 font-bold">
                    ✗ −EV {Math.abs(potOdds.ev).toFixed(1)} BB
                  </span>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              potOdds.ev > 0
                ? 'bg-vivid-green/15 text-vivid-green'
                : 'bg-red-400/15 text-red-400'
            }`}>
              {potOdds.ev > 0 ? '建议跟注' : '建议弃牌'}
            </span>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHigh ? 'bg-vivid-green' : isMid ? 'bg-gold' : 'bg-red-400'
            }`}
            style={{ width: `${Math.max(analysis.equity * 100, 2)}%` }}
          />
          {potOdds && (
            <div
              className="relative -top-1.5 w-0.5 h-2.5 bg-white/50 rounded-full"
              style={{
                marginLeft: `${Math.min(potOdds.required * 100, 98)}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* ═══ Chip Inputs ═══ */}
      <div className="space-y-3 pt-1">
        <ChipInput label="底池" value={pot} onChange={setPot} />
        <ChipInput label="跟注" value={bet} onChange={setBet} />
      </div>

      {/* ═══ Commentary / Detail ═══ */}

      {/* Preflop commentary */}
      {stage === 'preflop' && analysis.comment && (
        <p className="text-white/60 text-xs leading-relaxed">
          {analysis.comment}
        </p>
      )}

      {/* Postflop: collapsible outs + hand distribution */}
      {stage === 'postflop' && (analysis.outsInfo || analysis.handDistribution) && (
        <>
          <button
            onClick={() => setDetailExpanded(v => !v)}
            className="flex items-center gap-1 text-white/40 hover:text-white/60 transition-colors"
          >
            <span className="text-[10px] font-medium tracking-wider uppercase">
              详细分析
            </span>
            {detailExpanded
              ? <ChevronUp size={12} strokeWidth={2} />
              : <ChevronDown size={12} strokeWidth={2} />
            }
          </button>

          {detailExpanded && (
            <div className="space-y-2">
              {analysis.outsInfo && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-neon-blue font-medium">
                    {analysis.outsInfo.type === 'flush' && '同花听牌'}
                    {analysis.outsInfo.type === 'oesd' && '两头顺听牌'}
                    {analysis.outsInfo.type === 'gutshot' && '卡顺听牌'}
                    {analysis.outsInfo.type === 'combo' && '组合听牌'}
                  </span>
                  <span className="text-white/40">
                    {analysis.outsInfo.outs} 张 Outs · {commFilled.length >= 4 ? '下轮约' : '到河牌约'} {(analysis.outsInfo.probability * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              {analysis.handDistribution && (() => {
                const visibleTypes = analysis.handDistribution.filter(d => d.probability >= 0.0005)
                if (visibleTypes.length === 0) return null
                return (
                  <div className="space-y-1">
                    <span className="flex items-center gap-1 text-white/50 text-[10px] font-medium tracking-wider uppercase">
                      <BarChart3 size={12} strokeWidth={2} />
                      牌型分布
                    </span>
                    {visibleTypes.map(({ name, probability }) => {
                      const pct = (probability * 100).toFixed(1)
                      return (
                        <div key={name} className="flex items-center gap-2">
                          <span className="text-white/40 text-[10px] w-10 shrink-0">{name}</span>
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gold/40 transition-all duration-500"
                              style={{ width: `${Math.max(probability * 100, 0.5)}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums w-10 text-right shrink-0 text-white/30">
                            {pct}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}

      {/* Iterations label */}
      {stage === 'postflop' && (
        <p className="text-white/20 text-[10px]">
          {commFilled.length === 4
            ? `基于 ${analysisPlayerCount} 人局 44 张河牌穷举计算`
            : `基于 ${analysisPlayerCount} 人局 4000 次蒙特卡洛模拟`
          }
        </p>
      )}
    </GlassPanel>
  )
}
