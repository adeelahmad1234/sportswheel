import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from '../context/ThemeContext'

const VISIBLE = 5          // slots visible on drum
const ANGLE_DEG = 28       // degrees between adjacent slots
const RADIUS = 165         // cylinder radius in px
const ITEM_H = 84          // px height of each slot

export default function Spinner({ items, onResult, accentColor, disabled }) {
  const { theme } = useTheme()
  const [offset, setOffset] = useState(0)   // float: 0 = items[0] centered
  const [spinning, setSpinning] = useState(false)
  const offsetRef = useRef(0)
  const rafRef = useRef(null)
  const n = items.length

  // Reset when item list changes (filter or tab switch)
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    offsetRef.current = 0
    setOffset(0)
    setSpinning(false)
  }, [items])

  function spin() {
    if (spinning || disabled || n === 0) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setSpinning(true)

    const start = offsetRef.current
    const targetSlot = Math.floor(Math.random() * n)
    const currentSlot = ((Math.round(start) % n) + n) % n
    const delta = ((targetSlot - currentSlot) + n) % n
    const rounds = 4 + Math.floor(Math.random() * 3)
    const end = start + rounds * n + delta

    const duration = 2800
    const t0 = performance.now()

    // Quartic ease-out: fast start, long satisfying deceleration
    function ease(t) { return 1 - Math.pow(1 - t, 4) }

    function frame(now) {
      const t = Math.min((now - t0) / duration, 1)
      const cur = start + ease(t) * (end - start)
      offsetRef.current = cur
      setOffset(cur)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        const settled = ((targetSlot % n) + n) % n
        offsetRef.current = settled
        setOffset(settled)
        setSpinning(false)
        onResult?.(items[settled])
      }
    }

    rafRef.current = requestAnimationFrame(frame)
  }

  // For each visible slot d (-VISIBLE..+VISIBLE), compute 3D cylinder position
  function slotStyle(dist) {
    const rad = dist * ANGLE_DEG * (Math.PI / 180)
    const y = -RADIUS * Math.sin(rad)                  // up = negative screen Y
    const z = RADIUS * (Math.cos(rad) - 1)             // away from viewer = negative Z
    const opacity = Math.max(0, Math.cos(rad)) ** 1.6  // fade off at edges
    const visible = Math.abs(dist) < VISIBLE / 2 + 0.8
    return { y, z, rotX: dist * ANGLE_DEG, opacity, visible }
  }

  const centerRounded = Math.round(offsetRef.current)
  const frac = offsetRef.current - centerRounded  // -0.5 to +0.5

  const slots = []
  const half = Math.ceil(VISIBLE / 2) + 2
  for (let d = -half; d <= half; d++) {
    const dist = d - frac
    const idx = (((centerRounded + d) % n) + n) % n
    slots.push({ d, dist, idx })
  }

  const drumH = VISIBLE * ITEM_H

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {/* Drum shell */}
      <div
        onClick={spin}
        style={{
          width: 224,
          height: drumH,
          position: 'relative',
          borderRadius: 18,
          background: theme.deep,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 0 0 1px ${accentColor}22, ${theme.spinnerShadow}`,
          cursor: spinning || disabled ? 'default' : 'pointer',
          userSelect: 'none',
          overflow: 'hidden',
        }}
      >
        {/* 3D perspective container */}
        <div style={{
          position: 'absolute',
          inset: 0,
          perspective: '460px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ position: 'relative', width: '100%', height: ITEM_H, transformStyle: 'preserve-3d' }}>
            {slots.map(({ d, dist, idx }) => {
              const { y, z, rotX, opacity, visible } = slotStyle(dist)
              if (!visible) return null
              const item = items[idx]
              return (
                <div
                  key={d}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    transform: `translateY(${y}px) translateZ(${z}px) rotateX(${-rotX}deg)`,
                    opacity,
                    backfaceVisibility: 'hidden',
                    pointerEvents: 'none',
                  }}
                >
                  {item?.logo && (
                    <img
                      src={item.logo}
                      alt=""
                      style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                  <span style={{
                    color: theme.text,
                    fontSize: item?.logo ? 11 : 19,
                    fontWeight: 700,
                    textAlign: 'center',
                    padding: '0 10px',
                    lineHeight: 1.2,
                    textShadow: theme.id === 'light' ? 'none' : '0 1px 6px rgba(0,0,0,0.8)',
                  }}>
                    {item?.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top gradient fade */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '38%',
          background: `linear-gradient(to bottom, ${theme.deep} 0%, transparent 100%)`,
          pointerEvents: 'none', zIndex: 10,
        }} />
        {/* Bottom gradient fade */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '38%',
          background: `linear-gradient(to top, ${theme.deep} 0%, transparent 100%)`,
          pointerEvents: 'none', zIndex: 10,
        }} />

        {/* Center selection band */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: '50%', marginTop: -ITEM_H / 2,
          height: ITEM_H,
          borderTop: `1px solid ${accentColor}55`,
          borderBottom: `1px solid ${accentColor}55`,
          background: `${accentColor}09`,
          pointerEvents: 'none', zIndex: 5,
        }} />
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || disabled}
        style={{
          padding: '8px 28px',
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          background: spinning || disabled ? theme.border : accentColor,
          color: spinning || disabled ? theme.textMuted : '#fff',
          border: 'none',
          cursor: spinning || disabled ? 'not-allowed' : 'pointer',
          boxShadow: spinning || disabled ? 'none' : `0 0 22px ${accentColor}55`,
          transition: 'all 0.2s',
        }}
      >
        {spinning ? 'Spinning…' : 'Spin'}
      </button>
    </div>
  )
}
