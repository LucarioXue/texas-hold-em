/**
 * Pot Odds & EV calculation utilities.
 *
 * All amounts use the same abstract unit (e.g. BB or chips).
 * The caller doesn't need to convert anything — just pass what
 * the user entered.
 */

/** Minimum equity required for a call to break even. */
export function calcRequiredEquity(pot: number, call: number): number {
  const denominator = pot + call + call
  if (denominator <= 0) return 0
  return call / denominator
}

/** Expected value of calling (same unit as pot / call). */
export function calcEV(equity: number, pot: number, call: number): number {
  return equity * pot - (1 - equity) * call
}
