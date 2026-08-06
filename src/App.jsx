import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeProvider, THEMES, useTheme } from './context/ThemeContext'
import LeagueSection from './components/LeagueSection'
import ComingSoonOverlay from './components/ComingSoonOverlay'
import { LEAGUES } from './data/leagues'
import { fetchNBAStats } from './api/nba'
import { fetchNFLStats } from './api/nfl'
import { fetchNHLStats } from './api/nhl'
import { fetchMLBStats } from './api/mlb'

const TABS = [
  { id: 'NBA', fetch: fetchNBAStats },
  { id: 'NFL', fetch: fetchNFLStats },
  { id: 'NHL', fetch: fetchNHLStats },
  { id: 'MLB', fetch: fetchMLBStats },
]

function ThemePicker() {
  const { theme, setTheme } = useTheme()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {Object.values(THEMES).map(t => (
        <button
          key={t.id}
          onClick={() => setTheme(t)}
          title={t.label}
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: t.swatch,
            border: theme.id === t.id
              ? `2px solid ${theme.text}`
              : `2px solid ${theme.border}`,
            cursor: 'pointer',
            padding: 0,
            transition: 'border 0.15s, transform 0.15s',
            transform: theme.id === t.id ? 'scale(1.2)' : 'scale(1)',
            boxShadow: theme.id === t.id ? `0 0 0 1px ${theme.textMuted}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

function AppInner() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState('NBA')
  const active = TABS.find(t => t.id === activeTab)
  const league = LEAGUES[activeTab]

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, transition: 'background 0.3s, color 0.3s' }}>
      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        padding: '12px 24px',
        background: theme.navBg,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${theme.border}`,
      }}>
        {/* Left: theme picker */}
        <div style={{ justifySelf: 'start' }}>
          <ThemePicker />
        </div>

        {/* Center: wordmark — grid column keeps this on the true viewport center regardless of how wide the side columns are */}
        <span style={{ justifySelf: 'center', fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: theme.text, whiteSpace: 'nowrap' }}>
          Sports<span style={{ color: league.color }}>Wheel</span>
        </span>

        {/* Right: league tabs */}
        <nav style={{ justifySelf: 'end', display: 'flex', gap: 4 }}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab
            const tl = LEAGUES[tab.id]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  position: 'relative',
                  padding: '7px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  background: isActive ? `${tl.color}20` : 'transparent',
                  color: isActive ? theme.text : theme.textMuted,
                  border: `1px solid ${isActive ? tl.color + '55' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {tl.logo && (
                  <img
                    src={tl.logo}
                    alt=""
                    style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0, opacity: isActive ? 1 : 0.55 }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                {tab.id}
              </button>
            )
          })}
        </nav>
      </header>

      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '48px 16px 32px',
        background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${league.color}18 0%, transparent 70%)`,
        transition: 'background 0.4s',
      }}>
        <AnimatePresence mode="wait">
          <motion.h1
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ margin: '0 0 10px', fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', color: theme.text }}
          >
            {league.label} <span style={{ color: league.color }}>Stats</span>
          </motion.h1>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            style={{ margin: '0 auto', maxWidth: 560, fontSize: 14, lineHeight: 1.5, color: theme.textMuted }}
          >
            {league.description}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Main */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 96px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.22 }}
            style={{ position: 'relative' }}
          >
            <div style={activeTab === 'NFL' ? { filter: 'blur(3px) grayscale(0.3)', opacity: 0.5, pointerEvents: 'none', userSelect: 'none' } : undefined}>
              <LeagueSection league={league} fetchStats={active.fetch} />
            </div>
            {activeTab === 'NFL' && (
              <ComingSoonOverlay
                accentColor={league.color}
                message="ESPN's free public API doesn't provide real per-player NFL stats — only roster bio data. We're working on a proper stats source."
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>
        SportsWheel · Stats via official league APIs · For personal use only
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
