import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from './Spinner'
import RewardEffect from './RewardEffect'
import StatsTable from './StatsTable'
import GuessGame from './GuessGame'
import GameSetupPrompt from './GameSetupPrompt'
import LeagueFilter from './LeagueFilter'
import SpinAgainButton from './SpinAgainButton'
import { useTheme } from '../context/ThemeContext'

const CURRENT_YEAR = new Date().getFullYear()

// Year value = ending year of season. e.g. value=2022 → label "2021-22"
function seasonLabel(y) {
  return `${y - 1}-${String(y).slice(2)}`
}

export default function LeagueSection({ league, fetchStats }) {
  const { theme } = useTheme()
  const { id: leagueId, color, teams, divisions, minYear, excludeYears } = league

  const [yearFrom, setYearFrom] = useState(2015)
  const [yearTo, setYearTo] = useState(CURRENT_YEAR)
  const [filteredTeamNames, setFilteredTeamNames] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showReward, setShowReward] = useState(false)
  const [players, setPlayers] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasResult, setHasResult] = useState(false)
  const [spinKey, setSpinKey] = useState(0)
  const [viewMode, setViewMode] = useState('guess')
  const [statuses, setStatuses] = useState({})       // id -> 'guessed' | 'revealed', shared by GuessGame + StatsTable
  const [gaveUp, setGaveUp] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const [timerDuration, setTimerDuration] = useState(null)  // null = not chosen yet, 0 = unlimited, else seconds

  const yearResultRef = useRef(null)
  const teamResultRef = useRef(null)
  const scrollYRef = useRef(null)

  // Preserve scroll position across the Guess/Answers toggle instead of letting the swapped
  // content's different height jerk the page back to the top.
  useLayoutEffect(() => {
    if (scrollYRef.current != null) {
      window.scrollTo(0, scrollYRef.current)
      scrollYRef.current = null
    }
  }, [viewMode])

  function switchView(mode) {
    if (mode === viewMode) return
    scrollYRef.current = window.scrollY
    setViewMode(mode)
  }

  const selectableYears = useMemo(() => {
    const years = Array.from({ length: CURRENT_YEAR - minYear + 1 }, (_, i) => minYear + i)
    return excludeYears?.length ? years.filter(y => !excludeYears.includes(y)) : years
  }, [minYear, excludeYears])

  // "To" can never go below "From" — it can only match it (a single-year spinner) or exceed it.
  const selectableYearsTo = useMemo(() => selectableYears.filter(y => y >= yearFrom), [selectableYears, yearFrom])

  function handleYearFromChange(value) {
    setYearFrom(value)
    if (yearTo < value) setYearTo(value)
  }

  const yearItems = useMemo(() => {
    const from = Math.max(minYear, Math.min(yearFrom, yearTo))
    const to = Math.max(from, yearTo)
    const years = []
    for (let y = to; y >= from; y--) {
      if (excludeYears?.includes(y)) continue
      years.push({ label: seasonLabel(y), value: y })
    }
    return years
  }, [yearFrom, yearTo, minYear, excludeYears])

  const teamItems = useMemo(() => {
    const pool = filteredTeamNames
      ? teams.filter(t => filteredTeamNames.includes(t.name))
      : teams
    return pool.map(t => ({ label: t.name, value: t.id, logo: t.logo, team: t }))
  }, [teams, filteredTeamNames])

  async function handleBothSpun(year, team) {
    setShowReward(true)
    setTimeout(() => setShowReward(false), 1200)
    setLoading(true)
    setError(null)
    setPlayers(null)
    setHasResult(true)
    setViewMode('guess')
    setStatuses({})
    setGaveUp(false)
    setTimeExpired(false)
    setTimerDuration(null)
    try {
      const data = await fetchStats(team, year)   // pass full team object
      setPlayers(data)
    } catch (e) {
      setError(e.message || 'Failed to load stats. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function onYearResult(item) {
    setSelectedYear(item.value)
    yearResultRef.current = item.value
    if (teamResultRef.current) {
      handleBothSpun(item.value, teamResultRef.current)
    }
  }

  function onTeamResult(item) {
    setSelectedTeam(item.team)
    teamResultRef.current = item.team
    if (yearResultRef.current) {
      handleBothSpun(yearResultRef.current, item.team)
    }
  }

  function reset() {
    setSelectedYear(null)
    setSelectedTeam(null)
    setPlayers(null)
    setError(null)
    setHasResult(false)
    setViewMode('guess')
    setStatuses({})
    setGaveUp(false)
    setTimeExpired(false)
    setTimerDuration(null)
    yearResultRef.current = null
    teamResultRef.current = null
    setSpinKey(k => k + 1)
  }

  const sel = `1px solid ${theme.border}`
  const selStyle = { background: theme.deep, border: sel }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <RewardEffect show={showReward} accentColor={color} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, alignItems: 'center', width: '100%' }}>

        {/* Year range */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, justifyContent: 'center', padding: '14px 24px', borderRadius: 16, ...selStyle }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.textMuted }}>
            Year Range
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={yearFrom} onChange={e => handleYearFromChange(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, outline: 'none', background: theme.surface, color: theme.text, border: `1px solid ${theme.borderSubtle}`, cursor: 'pointer' }}>
              {selectableYears.map(y => <option key={y} value={y}>{seasonLabel(y)}</option>)}
            </select>
            <span style={{ color: theme.textMuted }}>→</span>
            <select value={yearTo} onChange={e => setYearTo(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, outline: 'none', background: theme.surface, color: theme.text, border: `1px solid ${theme.borderSubtle}`, cursor: 'pointer' }}>
              {[...selectableYearsTo].reverse().map(y => <option key={y} value={y}>{seasonLabel(y)}</option>)}
            </select>
          </div>
        </div>

        {/* League filter */}
        <LeagueFilter divisions={divisions} accentColor={color} onFilter={setFilteredTeamNames} />

        {/* Spinners */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start', justifyContent: 'center' }}>
          {[
            { label: 'Year', items: yearItems, onResult: onYearResult, key: `year-${spinKey}` },
            { label: 'Team', items: teamItems, onResult: onTeamResult, key: `team-${spinKey}` },
          ].map(s => (
            <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color }}>
                {s.label}
              </span>
              <Spinner key={s.key} items={s.items} onResult={s.onResult} accentColor={color} />
            </div>
          ))}
        </div>

        {!hasResult && (
          <p style={{ fontSize: 14, color: theme.textMuted }}>Spin both wheels to load the roster & stats</p>
        )}

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ width: '100%', borderRadius: 16, overflow: 'hidden', background: theme.deep, border: `1px solid ${theme.border}`, minHeight: 200 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: 48, margin: '8px 16px', borderRadius: 10,
                  background: `linear-gradient(90deg, ${theme.shimmer1} 25%, ${theme.shimmer2} 50%, ${theme.shimmer1} 75%)`,
                  backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', opacity: 1 - i * 0.1,
                }} />
              ))}
              <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div style={{ width: '100%', padding: '20px 24px', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: theme.errorBg, border: `1px solid ${theme.errorBorder}` }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#ff6b6b', margin: 0 }}>{error}</p>
            <button onClick={() => selectedYear && selectedTeam && handleBothSpun(selectedYear, selectedTeam)}
              style={{ padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: color, color: '#fff', border: 'none', cursor: 'pointer' }}>
              Retry
            </button>
          </div>
        )}

        {/* Guess game / Answers toggle + content */}
        {players && !loading && (
          <>
            <div style={{ display: 'inline-flex', padding: 4, borderRadius: 999, background: theme.deep, border: `1px solid ${theme.border}` }}>
              {[
                { id: 'guess', label: 'Guess' },
                { id: 'answers', label: 'Answers' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => switchView(m.id)}
                  style={{
                    padding: '8px 24px', borderRadius: 999, fontSize: 13, fontWeight: 800,
                    letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
                    background: viewMode === m.id ? color : 'transparent',
                    color: viewMode === m.id ? '#fff' : theme.textMuted,
                    transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Both stay mounted (display:none, not conditional) so GuessGame's local state
                (input, timer, position hints) and the page's scroll position survive toggling. */}
            <div style={{ display: viewMode === 'guess' ? 'block' : 'none', width: '100%' }}>
              {timerDuration === null ? (
                <GameSetupPrompt accentColor={color} onSelect={setTimerDuration} />
              ) : (
                <GuessGame
                  key={`${selectedTeam?.id}-${selectedYear}`}
                  players={players} accentColor={color} team={selectedTeam} year={selectedYear}
                  leagueId={leagueId}
                  statuses={statuses} onStatusesChange={setStatuses}
                  gaveUp={gaveUp} timeExpired={timeExpired}
                  onGiveUp={isTimeout => { setGaveUp(true); if (isTimeout) setTimeExpired(true) }}
                  timerDuration={timerDuration}
                />
              )}
            </div>
            <div style={{ display: viewMode === 'answers' ? 'block' : 'none', width: '100%' }}>
              <StatsTable players={players} accentColor={color} team={selectedTeam} year={selectedYear} statuses={statuses} />
            </div>

            <button onClick={reset}
              style={{ marginTop: 8, marginBottom: 32, padding: '12px 32px', borderRadius: 999, fontWeight: 700, fontSize: 14, background: 'transparent', color, border: `1px solid ${color}`, cursor: 'pointer' }}>
              ↺ Spin Again
            </button>
          </>
        )}
      </div>

      <SpinAgainButton show={hasResult && !loading} onClick={reset} accentColor={color} />
    </div>
  )
}
