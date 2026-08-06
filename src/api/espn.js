// Shared ESPN API helpers used by NBA, NFL, and NHL

const SITE = 'https://site.api.espn.com/apis/site/v2/sports'

// Look up ESPN's internal numeric team ID from a team abbreviation
export async function getESPNTeamId(sport, league, abbr) {
  const res = await fetch(`${SITE}/${sport}/${league}/teams/${abbr.toLowerCase()}`)
  if (!res.ok) throw new Error(`${league.toUpperCase()} team "${abbr}" not found (ESPN ${res.status})`)
  const data = await res.json()
  const id = data.team?.id
  if (!id) throw new Error(`ESPN returned no ID for "${abbr}"`)
  return id
}

// Fetch roster for a team by ESPN numeric ID
// Returns a flat array of athlete objects
export async function getESPNRoster(sport, league, espnTeamId, year) {
  const url = year
    ? `${SITE}/${sport}/${league}/teams/${espnTeamId}/roster?season=${year}`
    : `${SITE}/${sport}/${league}/teams/${espnTeamId}/roster`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`${league.toUpperCase()} roster error: ${res.status}`)
  const data = await res.json()

  const athletes = []
  for (const entry of (data.athletes || [])) {
    // Entry is either a position-group { items: [...] } or a direct athlete object
    if (Array.isArray(entry.items)) {
      athletes.push(...entry.items)
    } else if (entry.id) {
      athletes.push(entry)
    }
  }
  return athletes
}

// Helper formatters
export function fmt(v, decimals = 1) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  return isNaN(n) ? String(v) : n.toFixed(decimals)
}

export function fmtInt(v) {
  if (v == null || v === '') return '—'
  return String(Math.round(Number(v)))
}

export function fmtPct(v) {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return '—'
  // ESPN returns percentages as fractions (0.456) — multiply by 100
  return n < 1 ? `${(n * 100).toFixed(1)}%` : `${n.toFixed(1)}%`
}
