/**
 * Web Worker for Monte Carlo simulation.
 *
 * Runs off the main thread so card input / slider drag stay snappy.
 * Accepts { id, holeCards, communityCards, playerCount, iterations }
 * and posts back { id, result } when done.
 */

import { runSimulation } from './utils/montecarlo'
import type { Card } from './types'

interface WorkerRequest {
  id: number
  holeCards: [Card, Card]
  communityCards: Card[]
  playerCount: number
  iterations: number
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, holeCards, communityCards, playerCount, iterations } = e.data
  const result = runSimulation(holeCards, communityCards, playerCount, iterations)
  self.postMessage({ id, result })
}
