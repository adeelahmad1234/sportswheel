import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function rand(a, b) {
  return a + Math.random() * (b - a)
}

function ConfettiPiece({ color, x, delay, duration, size, rotate }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: '-8vh', rotate: 0 }}
      animate={{ opacity: [1, 1, 0], y: '108vh', rotate }}
      transition={{ duration, delay, ease: 'easeIn' }}
      style={{
        position: 'fixed',
        top: 0,
        left: `${x}vw`,
        width: size,
        height: size * 0.45,
        background: color,
        borderRadius: 2,
        pointerEvents: 'none',
        zIndex: 70,
      }}
    />
  )
}

// Effect intensity scales with result quality — the two lower tiers get a plain color
// flash (no confetti, since a wash-out result shouldn't feel celebratory), the two upper
// tiers rain confetti, with the perfect-score tier getting more pieces + a richer palette.
const CONFIG = {
  elite: { confettiCount: 70, palette: ['#a855f7', '#eab308', '#22c55e', '#3b82f6', '#ffffff'], glowOpacity: 0.22 },
  good: { confettiCount: 32, palette: ['#22c55e', '#ffffff'], glowOpacity: 0.16 },
  average: { confettiCount: 0, palette: [], glowOpacity: 0.14 },
  poor: { confettiCount: 0, palette: [], glowOpacity: 0.14 },
}

export default function ResultEffect({ show, tier, color }) {
  const cfg = CONFIG[tier] || CONFIG.average

  const pieces = useMemo(() => {
    if (!show || !cfg.confettiCount) return []
    return Array.from({ length: cfg.confettiCount }, (_, i) => ({
      id: i,
      color: cfg.palette[i % cfg.palette.length],
      x: rand(0, 100),
      delay: rand(0, 0.35),
      duration: rand(1.6, 2.8),
      size: rand(6, 12),
      rotate: rand(-540, 540),
    }))
    // Regenerate only when a new result actually fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, tier])

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, cfg.glowOpacity, 0] }}
            transition={{ duration: 1, times: [0, 0.3, 1] }}
            style={{ position: 'fixed', inset: 0, background: color, pointerEvents: 'none', zIndex: 50 }}
          />
          {pieces.map(p => (
            <ConfettiPiece key={p.id} {...p} />
          ))}
        </>
      )}
    </AnimatePresence>
  )
}
