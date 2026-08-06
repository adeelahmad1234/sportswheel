import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export default function LeagueFilter({ divisions, onFilter, accentColor }) {
  const { theme } = useTheme()
  const [activeConf, setActiveConf] = useState('Full League')
  const [activeDiv, setActiveDiv] = useState(null)

  const conferences = Object.keys(divisions)
  const currentDivisions = activeConf !== 'Full League' && divisions[activeConf]
    ? Object.keys(divisions[activeConf])
    : []

  function selectConf(conf) {
    setActiveConf(conf)
    setActiveDiv(null)
    if (conf === 'Full League') {
      onFilter(null)
    } else {
      onFilter(Object.values(divisions[conf]).flat())
    }
  }

  function selectDiv(div) {
    setActiveDiv(div)
    onFilter(divisions[activeConf][div])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      {/* Conference pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {conferences.map(conf => {
          const active = activeConf === conf
          return (
            <button key={conf} onClick={() => selectConf(conf)}
              style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                background: active ? accentColor : theme.surface,
                color: active ? '#fff' : theme.textMuted,
                border: `1px solid ${active ? accentColor : theme.border}`,
                boxShadow: active ? `0 0 12px ${accentColor}44` : 'none',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {conf}
            </button>
          )
        })}
      </div>

      {/* Division pills */}
      {currentDivisions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {currentDivisions.map(div => {
            const active = activeDiv === div
            return (
              <button key={div} onClick={() => selectDiv(div)}
                style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  background: active ? `${accentColor}28` : theme.deep,
                  color: active ? accentColor : theme.textMuted,
                  border: `1px solid ${active ? accentColor + '88' : theme.border}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {div}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
