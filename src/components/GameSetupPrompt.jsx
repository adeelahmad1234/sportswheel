import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'

const OPTIONS = [
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '20 min', seconds: 1200 },
  { label: 'Unlimited', seconds: 0 },
]

export default function GameSetupPrompt({ accentColor, onSelect }) {
  const { theme } = useTheme()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        padding: '32px 28px', borderRadius: 20, textAlign: 'center',
        background: theme.surface, border: `1px solid ${theme.border}`,
      }}
    >
      <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: theme.text }}>
        Want to play against the clock?
      </h3>
      <p style={{ margin: '0 0 22px', fontSize: 13.5, color: theme.textMuted }}>
        Pick a time limit for guessing the roster, or go unlimited.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {OPTIONS.map(opt => (
          <button
            key={opt.label}
            onClick={() => onSelect(opt.seconds)}
            style={{
              padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 800,
              background: opt.seconds === 0 ? 'transparent' : `${accentColor}18`,
              color: opt.seconds === 0 ? theme.textMuted : accentColor,
              border: `1px solid ${opt.seconds === 0 ? theme.border : accentColor + '44'}`,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
