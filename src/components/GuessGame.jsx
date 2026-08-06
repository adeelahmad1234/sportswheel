import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { groupByStatShape, labelForStatKeys } from '../utils/positionGroups'
import { findGuessMatches } from '../utils/nameMatch'
import { fullPositionName } from '../utils/positionNames'
import { GREEN, RED } from '../utils/statusColors'
import RewardEffect from './RewardEffect'

function jerseyValue(p) {
  const n = parseInt(p.jersey)
  return isNaN(n) ? 999 : n
}

function formatClock(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// status: 'hidden' | 'guessed' | 'revealed' (revealed = surfaced via Give Up / timeout, not earned)
function PlayerBox({ player, status, positionLabel, showPositionHint, showJerseyHint, accentColor }) {
  const { theme } = useTheme()
  const revealed = status !== 'hidden'
  const statusColor = status === 'guessed' ? GREEN : status === 'revealed' ? RED : null
  const jerseyVisible = revealed || showJerseyHint
  const badgeColor = statusColor || (jerseyVisible ? accentColor : theme.textMuted)

  return (
    <div style={{
      borderRadius: 14,
      border: `1px solid ${statusColor ? `${statusColor}66` : theme.border}`,
      background: statusColor ? `${statusColor}0f` : theme.deep,
      padding: '16px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      minHeight: 104,
      transition: 'border-color 0.4s, background 0.4s',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 30, height: 24, padding: '0 6px', borderRadius: 6,
        background: `${badgeColor}22`,
        color: badgeColor,
        border: `1px solid ${badgeColor}44`,
        fontSize: 12, fontWeight: 800, fontFamily: 'monospace',
      }}>
        {jerseyVisible ? player.jersey : '?'}
      </span>

      <AnimatePresence mode="wait" initial={false}>
        {revealed ? (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
          >
            <span style={{ fontSize: 14, fontWeight: 800, textAlign: 'center', lineHeight: 1.25, color: theme.text }}>
              {player.name}
            </span>
            {positionLabel && (
              <span style={{ fontSize: 11, fontWeight: 700, color: statusColor || theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {positionLabel}
              </span>
            )}
          </motion.div>
        ) : showPositionHint && positionLabel ? (
          <motion.span
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: 12, fontWeight: 700, fontStyle: 'italic', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.03em' }}
          >
            {positionLabel}
          </motion.span>
        ) : (
          <motion.span
            key="blank"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ width: '60%', height: 9, borderRadius: 999, background: theme.borderSubtle }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function BoxGroup({ label, players, statuses, leagueId, showPositionHint, showJerseyHint, accentColor }) {
  const sorted = useMemo(() => [...players].sort((a, b) => jerseyValue(a) - jerseyValue(b)), [players])
  return (
    <div style={{ marginBottom: 24 }}>
      {label && (
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>
          {label} · {players.length}
        </h4>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
        {sorted.map(p => (
          <PlayerBox
            key={p.id}
            player={p}
            status={statuses[p.id] || 'hidden'}
            positionLabel={fullPositionName(leagueId, p.position)}
            showPositionHint={showPositionHint}
            showJerseyHint={showJerseyHint}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  )
}

export default function GuessGame({
  players, accentColor, team, year, leagueId,
  statuses, onStatusesChange, gaveUp, timeExpired, onGiveUp,
  timerDuration,
}) {
  const { theme } = useTheme()
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [positionsRevealed, setPositionsRevealed] = useState(false)
  const [jerseysRevealed, setJerseysRevealed] = useState(false)
  const [remaining, setRemaining] = useState(timerDuration || null)
  const inputRef = useRef(null)
  const startRef = useRef(Date.now())
  const timedOutRef = useRef(false)

  const total = players?.length || 0
  const guessedCount = Object.values(statuses).filter(s => s === 'guessed').length
  const done = total > 0 && guessedCount === total

  useEffect(() => {
    if (!done) return
    setCelebrate(true)
    const t = setTimeout(() => setCelebrate(false), 1100)
    return () => clearTimeout(t)
  }, [done])

  // Reveals every not-yet-guessed player as 'revealed' (red) — shared by the manual Give Up
  // button and the timeout path below, so a game that ends by running out of time flips the
  // whole board exactly like giving up does, instead of leaving unguessed boxes blank.
  function revealRemaining() {
    const next = { ...statuses }
    for (const p of players) if (!next[p.id]) next[p.id] = 'revealed'
    onStatusesChange(next)
  }

  // Countdown — ticks locally off a fixed start timestamp so it stays accurate regardless of
  // React re-renders, and keeps running even while the Answers tab is showing (this component
  // stays mounted, just hidden, when the view toggles).
  useEffect(() => {
    if (!timerDuration || gaveUp || done) return
    const id = setInterval(() => {
      const left = timerDuration - Math.floor((Date.now() - startRef.current) / 1000)
      setRemaining(Math.max(left, 0))
      if (left <= 0 && !timedOutRef.current) {
        timedOutRef.current = true
        revealRemaining()
        onGiveUp(true)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [timerDuration, gaveUp, done, onGiveUp])

  const groups = useMemo(() => groupByStatShape(players || []), [players])
  const showGroupLabels = groups.length > 1

  if (!players || players.length === 0) return null

  const locked = gaveUp || done

  function submitGuess(e) {
    e.preventDefault()
    if (locked) return
    const guessedIds = new Set(Object.keys(statuses).filter(id => statuses[id] === 'guessed'))
    const matches = findGuessMatches(input, players, guessedIds)
    if (matches.length > 0) {
      const next = { ...statuses }
      for (const m of matches) next[m.id] = 'guessed'
      onStatusesChange(next)
      setInput('')
    } else if (input.trim()) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
    }
    inputRef.current?.focus()
  }

  function handleGiveUpClick() {
    revealRemaining()
    onGiveUp(false)
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <RewardEffect show={celebrate} accentColor={accentColor} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
        {/* Player boxes */}
        <div style={{ flex: '3 1 480px', minWidth: 280 }}>
          {groups.map((g, i) => (
            <BoxGroup
              key={g.statKeys.join('|') || i}
              label={showGroupLabels ? labelForStatKeys(g.statKeys) : null}
              players={g.players}
              statuses={statuses}
              leagueId={leagueId}
              showPositionHint={positionsRevealed}
              showJerseyHint={jerseysRevealed}
              accentColor={accentColor}
            />
          ))}
        </div>

        {/* Guess sidebar */}
        <div style={{
          flex: '1 1 260px', minWidth: 240, maxWidth: 340,
          position: 'sticky', top: 100,
          display: 'flex', flexDirection: 'column', gap: 14,
          padding: 20, borderRadius: 16,
          background: theme.surface, border: `1px solid ${theme.border}`,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {team?.name} · {seasonLabel(year)}
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 900, color: theme.text }}>
                {guessedCount}<span style={{ color: theme.textMuted, fontWeight: 700, fontSize: 15 }}> / {total} guessed</span>
              </p>
              {!!timerDuration && !locked && (
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: remaining <= 30 ? RED : theme.textMuted }}>
                  {formatClock(remaining ?? timerDuration)}
                </span>
              )}
            </div>
            {!locked && (positionsRevealed && jerseysRevealed) === false && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {!positionsRevealed && (
                  <button onClick={() => setPositionsRevealed(true)} style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, cursor: 'pointer',
                  }}>
                    💡 Reveal Positions
                  </button>
                )}
                {!jerseysRevealed && (
                  <button onClick={() => setJerseysRevealed(true)} style={{
                    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, cursor: 'pointer',
                  }}>
                    🔢 Reveal Jersey #s
                  </button>
                )}
              </div>
            )}
          </div>

          {!locked ? (
            <form onSubmit={submitGuess} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <motion.input
                ref={inputRef}
                animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                autoFocus
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Full name or last name…"
                style={{
                  padding: '14px 16px', borderRadius: 12, fontSize: 16, fontWeight: 600,
                  outline: 'none', background: theme.inputBg, color: theme.text,
                  border: `1.5px solid ${shake ? theme.errorBorder : theme.border}`,
                }}
              />
              <p style={{ margin: '0 0 4px', fontSize: 11, color: theme.textMuted }}>
                Last name alone works — first name alone doesn't.
              </p>
              <button type="submit" style={{
                padding: '12px 16px', borderRadius: 12, fontSize: 14, fontWeight: 800,
                background: accentColor, color: '#fff', border: 'none', cursor: 'pointer',
              }}>
                Guess
              </button>
            </form>
          ) : (
            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: done ? GREEN : timeExpired ? RED : theme.textMuted }}>
              {done ? '🎉 Full roster guessed!' : timeExpired ? '⏰ Time\'s up!' : 'Roster revealed'}
            </p>
          )}

          {!locked && (
            <button onClick={handleGiveUpClick} style={{
              marginTop: 4, padding: '14px 16px', borderRadius: 12, fontSize: 13, fontWeight: 800,
              background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, cursor: 'pointer',
            }}>
              Give Up — Reveal All
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function seasonLabel(y) {
  return `${y - 1}-${String(y).slice(2)}`
}
