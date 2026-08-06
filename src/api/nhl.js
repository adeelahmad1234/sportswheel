import { fmt, fmtInt } from './espn.js'

const BASE = 'https://api-web.nhle.com/v1'

// The official NHL API sends no CORS headers, so it can't be fetched directly
// from a browser. Route through a CORS-forwarding proxy that echoes the
// upstream status code and body untouched.
const PROXY = 'https://corsproxy.io/?url='

function nhlFetch(path) {
  return fetch(`${PROXY}${encodeURIComponent(`${BASE}${path}`)}`)
}

// positionCode → display abbreviation
const POS_LABEL = { C: 'C', L: 'LW', R: 'RW', D: 'D', G: 'G' }

function fullName(p) {
  const first = p.firstName?.default || ''
  const last = p.lastName?.default || ''
  return `${first} ${last}`.trim() || '—'
}

function formatHeight(inches) {
  if (inches == null) return '—'
  const ft = Math.floor(inches / 12)
  const inch = inches % 12
  return `${ft}' ${inch}"`
}

// Age as of Oct 1 of the season's starting year (matches how leagues display "season age")
function ageAtSeasonStart(birthDate, seasonStartYear) {
  if (!birthDate) return '—'
  const b = new Date(birthDate)
  const ref = new Date(`${seasonStartYear}-10-01`)
  let age = ref.getFullYear() - b.getFullYear()
  const m = ref.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--
  return String(age)
}

// avgTimeOnIcePerGame is in seconds — convert to MM:SS
function formatToi(seconds) {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatSavePct(v) {
  if (v == null) return '—'
  const n = Number(v)
  return `.${String(Math.round(n * 1000)).padStart(3, '0')}`
}

export async function fetchNHLStats(team, year) {
  const abbr = team.abbr
  // year = ending year of season (e.g. 2024 = 2023-24 season)
  const seasonId = `${year - 1}${year}`

  let rosterRes, statsRes
  try {
    [rosterRes, statsRes] = await Promise.all([
      nhlFetch(`/roster/${abbr}/${seasonId}`),
      nhlFetch(`/club-stats/${abbr}/${seasonId}/2`),
    ])
  } catch {
    throw new Error('Could not reach the NHL API right now (proxy issue). Please try again.')
  }

  if (!rosterRes.ok) {
    throw new Error(`No NHL roster found for ${team.name} in ${year - 1}-${String(year).slice(2)}. Try a different year.`)
  }
  const rosterData = await rosterRes.json()
  const statsData = statsRes.ok ? await statsRes.json() : { skaters: [], goalies: [] }

  const skaterStats = {}
  for (const s of statsData.skaters || []) skaterStats[s.playerId] = s
  const goalieStats = {}
  for (const g of statsData.goalies || []) goalieStats[g.playerId] = g

  const bioGroups = [
    ...(rosterData.forwards || []),
    ...(rosterData.defensemen || []),
  ].map(p => ({ p, isGoalie: false }))
  const goalieBios = (rosterData.goalies || []).map(p => ({ p, isGoalie: true }))
  const allPlayers = [...bioGroups, ...goalieBios]

  if (allPlayers.length === 0) {
    throw new Error(`No NHL roster found for ${team.name} in ${year - 1}-${String(year).slice(2)}. Try a different year.`)
  }

  return allPlayers.map(({ p, isGoalie }) => {
    const s = isGoalie ? (goalieStats[p.id] || {}) : (skaterStats[p.id] || {})

    const stats = isGoalie
      ? {
          GP:    fmtInt(s.gamesPlayed),
          W:     fmtInt(s.wins),
          L:     fmtInt(s.losses),
          OT:    fmtInt(s.overtimeLosses),
          GAA:   fmt(s.goalsAgainstAverage, 2),
          'SV%': formatSavePct(s.savePercentage),
          SO:    fmtInt(s.shutouts),
        }
      : {
          GP:     fmtInt(s.gamesPlayed),
          G:      fmtInt(s.goals),
          A:      fmtInt(s.assists),
          PTS:    fmtInt(s.points),
          '+/-':  s.plusMinus != null ? String(Math.round(Number(s.plusMinus))) : '—',
          PIM:    fmtInt(s.penaltyMinutes),
          SOG:    fmtInt(s.shots),
          'TOI/G': formatToi(s.avgTimeOnIcePerGame),
        }

    return {
      id:       p.id,
      jersey:   p.sweaterNumber ? String(p.sweaterNumber) : '—',
      name:     fullName(p),
      position: POS_LABEL[p.positionCode] || p.positionCode || '—',
      age:      ageAtSeasonStart(p.birthDate, year - 1),
      height:   formatHeight(p.heightInInches),
      weight:   p.weightInPounds ? `${p.weightInPounds} lbs` : '—',
      stats,
    }
  })
}
