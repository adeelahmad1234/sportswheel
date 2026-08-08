import { GREEN, RED } from './statusColors'

export const YELLOW = '#eab308'
export const PURPLE = '#a855f7'

// Ordered loosest-first; getResultTier walks from the top (100%) down.
const TIERS = [
  { key: 'elite', threshold: 1, color: PURPLE, message: 'ELITE BALL KNOWLEDGE' },
  { key: 'good', threshold: 0.67, color: GREEN, message: 'Ball Knowledge.' },
  { key: 'average', threshold: 0.33, color: YELLOW, message: 'Average Ball Knower' },
  { key: 'poor', threshold: 0, color: RED, message: 'Were you even trying?' },
]

export function getResultTier(guessedCount, total) {
  if (!total) return null
  const pct = guessedCount / total
  return TIERS.find(t => pct >= t.threshold) || TIERS[TIERS.length - 1]
}
