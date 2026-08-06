import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

function Particle({ color }) {
  const x = randomBetween(-60, 60)
  const y = randomBetween(-120, -40)
  const rotate = randomBetween(-360, 360)
  const size = randomBetween(6, 14)

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x, y, rotate, scale: 0.3 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        background: color,
        pointerEvents: 'none',
      }}
    />
  )
}

export default function RewardEffect({ show, accentColor }) {
  const particles = Array.from({ length: 28 }, (_, i) => i)
  const palette = [accentColor, '#ffffff', '#ffd700', accentColor + 'aa']

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Full-screen glow pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.18, 0] }}
            transition={{ duration: 0.9, times: [0, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: 0,
              background: accentColor,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />

          {/* Particle burst — centered in spinner area */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              pointerEvents: 'none',
              zIndex: 60,
            }}
          >
            {particles.map(i => (
              <Particle
                key={i}
                color={palette[i % palette.length]}
              />
            ))}
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
