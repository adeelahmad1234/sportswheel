import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { labelForStatKeys, groupByStatShape } from '../utils/positionGroups'
import { GREEN, RED } from '../utils/statusColors'

function SortIcon({ dir }) {
  if (!dir) return <span style={{ opacity: 0.3 }}> ⇅</span>
  return <span>{dir === 'asc' ? ' ↑' : ' ↓'}</span>
}

function BIO_VALUE(player, key) {
  if (key === '#') return parseInt(player.jersey) || 999
  if (key === 'Player') return player.name
  if (key === 'Pos') return player.position
  if (key === 'Age') return parseInt(player.age) || 0
  if (key === 'Height') return player.height
  if (key === 'Weight') return parseFloat(player.weight) || 0
  return null
}

function StatsGroupTable({ label, players, statKeys, accentColor, sortKey, sortDir, onSort, statuses, hasPlayed }) {
  const { theme } = useTheme()
  const allColumns = ['#', 'Player', 'Pos', 'Age', 'Height', 'Weight', ...statKeys]

  const rows = useMemo(() => {
    const bioKeys = ['#', 'Player', 'Pos', 'Age', 'Height', 'Weight']
    if (!sortKey || !allColumns.includes(sortKey)) return players
    return [...players].sort((a, b) => {
      let va, vb
      if (bioKeys.includes(sortKey)) { va = BIO_VALUE(a, sortKey); vb = BIO_VALUE(b, sortKey) }
      else { va = parseFloat(String(a.stats[sortKey]).replace('%', '')) || 0; vb = parseFloat(String(b.stats[sortKey]).replace('%', '')) || 0 }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [players, sortKey, sortDir])

  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>
          {label} · {players.length}
        </h4>
      )}
      <div style={{
        borderRadius: 16,
        overflow: 'auto',
        border: `1px solid ${theme.border}`,
        background: theme.deep,
        maxHeight: 560,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: theme.surface, position: 'sticky', top: 0, zIndex: 10 }}>
              {allColumns.map(col => (
                <th
                  key={col}
                  onClick={() => onSort(col)}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: sortKey === col ? accentColor : theme.textMuted,
                    borderBottom: `1px solid ${theme.border}`,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {col}<SortIcon dir={sortKey === col ? sortDir : null} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((player, i) => {
              const statusColor = hasPlayed ? (statuses[player.id] === 'guessed' ? GREEN : RED) : null
              const baseBg = statusColor ? `${statusColor}14` : (i % 2 === 0 ? 'transparent' : theme.rowAlt)
              return (
              <tr
                key={player.id}
                style={{ background: baseBg, borderLeft: statusColor ? `3px solid ${statusColor}` : '3px solid transparent' }}
                onMouseEnter={e => e.currentTarget.style.background = statusColor ? `${statusColor}22` : `${accentColor}12`}
                onMouseLeave={e => e.currentTarget.style.background = baseBg}
              >
                {/* Jersey # */}
                <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 26, borderRadius: 6,
                    background: `${accentColor}22`,
                    color: accentColor,
                    border: `1px solid ${accentColor}44`,
                    fontSize: 13, fontWeight: 800, fontFamily: 'monospace',
                  }}>
                    {player.jersey}
                  </span>
                </td>
                {/* Name */}
                <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 15, color: theme.text, whiteSpace: 'nowrap' }}>
                  {player.name}
                </td>
                {/* Position */}
                <td style={{ padding: '12px 16px', fontSize: 14, color: theme.textDim, whiteSpace: 'nowrap' }}>
                  {player.position}
                </td>
                {/* Age */}
                <td style={{ padding: '12px 16px', fontSize: 14, color: theme.textDim, whiteSpace: 'nowrap' }}>
                  {player.age}
                </td>
                {/* Height */}
                <td style={{ padding: '12px 16px', fontSize: 14, color: theme.textDim, whiteSpace: 'nowrap' }}>
                  {player.height}
                </td>
                {/* Weight */}
                <td style={{ padding: '12px 16px', fontSize: 14, color: theme.textDim, whiteSpace: 'nowrap' }}>
                  {player.weight}
                </td>
                {/* Stats */}
                {statKeys.map(k => (
                  <td key={k} style={{ padding: '12px 16px', fontSize: 15, fontWeight: 600, fontFamily: 'monospace', color: theme.text, whiteSpace: 'nowrap' }}>
                    {player.stats[k] ?? '—'}
                  </td>
                ))}
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function StatsTable({ players, accentColor, team, year, statuses = {} }) {
  const { theme } = useTheme()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('desc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const filtered = useMemo(() => {
    return (players || []).filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.position || '').toLowerCase().includes(search.toLowerCase())
    )
  }, [players, search])

  const groups = useMemo(() => groupByStatShape(filtered), [filtered])

  const showGroupLabels = groups.length > 1
  const hasPlayed = Object.keys(statuses).length > 0

  if (!players || players.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ width: '100%' }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text, letterSpacing: '-0.02em' }}>
            {team?.name} — {year} Season
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.textMuted }}>
            {filtered.length} players · click any column header to sort
          </p>
          {hasPlayed && (
            <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 700, color: theme.textMuted }}>
              <span style={{ color: GREEN }}>■</span> guessed correctly &nbsp;
              <span style={{ color: RED }}>■</span> not guessed
            </p>
          )}
        </div>
        <input
          type="text"
          placeholder="Search player or position…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 14,
            outline: 'none',
            width: 280,
            background: theme.inputBg,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{
          borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.deep,
          padding: '64px 0', textAlign: 'center', color: theme.textMuted, fontSize: 15,
        }}>
          No players match your search.
        </div>
      ) : (
        groups.map((g, i) => (
          <StatsGroupTable
            key={g.statKeys.join('|') || i}
            label={showGroupLabels ? labelForStatKeys(g.statKeys) : null}
            players={g.players}
            statKeys={g.statKeys}
            accentColor={accentColor}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            statuses={statuses}
            hasPlayed={hasPlayed}
          />
        ))
      )}
    </motion.div>
  )
}
