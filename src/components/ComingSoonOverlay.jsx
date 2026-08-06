import { useTheme } from '../context/ThemeContext'

// Temporary full-panel sticker for leagues without a working stats source yet (see NFL in
// CLAUDE.md's Known Limitations). Sits above a blurred, non-interactive LeagueSection.
export default function ComingSoonOverlay({ accentColor, message }) {
  const { theme } = useTheme()
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
      textAlign: 'center', padding: 24,
      background: `${theme.bg}cc`,
      backdropFilter: 'blur(6px)',
      borderRadius: 24,
    }}>
      <span style={{
        fontSize: 'clamp(26px, 5vw, 44px)',
        fontWeight: 900,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#fff',
        background: accentColor,
        padding: '14px 36px',
        borderRadius: 14,
        boxShadow: `0 0 48px ${accentColor}88`,
        transform: 'rotate(-6deg)',
      }}>
        Coming Soon
      </span>
      {message && (
        <p style={{ margin: 0, maxWidth: 340, fontSize: 13, fontWeight: 600, color: theme.textMuted, lineHeight: 1.5 }}>
          {message}
        </p>
      )}
    </div>
  )
}
