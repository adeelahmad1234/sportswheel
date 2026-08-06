import { getESPNTeamId, fmt, fmtInt, fmtPct } from './espn.js'

const SITE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba'
const CORE = 'https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba'

// How many regular-season games to sample when reconstructing a season roster (see below). More
// samples catch more of the roster — a player out for a long injury stretch (e.g. Khris
// Middleton missing the start AND end of the Bucks' 2022-23 season) can be absent from the first
// and last game alike but still show up in games spread through the middle of the season.
const ROSTER_SAMPLE_SIZE = 8

// ESPN's roster endpoint (site.../teams/{id}/roster?season=Y) and the CORE
// seasons/{y}/teams/{id}/athletes list both silently ignore the requested season — the former
// returns an empty athletes array for anything but the current season, the latter always returns
// the *current* roster no matter what year is in the URL. The one place ESPN's data is genuinely
// season-accurate is inside an actual game boxscore, so the roster is reconstructed from
// several completed regular-season games spread evenly across the season (covering players
// traded away or acquired mid-season, or out for extended injury stretches, not just whoever
// dressed for one or two sampled games).
async function getSeasonRosterFromBoxscores(espnTeamId, year) {
  const schedRes = await fetch(`${SITE}/teams/${espnTeamId}/schedule?season=${year}`)
  if (!schedRes.ok) throw new Error(`NBA schedule error: ${schedRes.status}`)
  const schedData = await schedRes.json()

  const regularSeasonFinals = (schedData.events || []).filter(
    e => e.seasonType?.type === 2 &&
      e.competitions?.[0]?.status?.type?.completed &&
      e.competitions?.[0]?.boxscoreAvailable !== false
  )
  if (regularSeasonFinals.length === 0) return []

  const n = regularSeasonFinals.length
  const sampleCount = Math.min(ROSTER_SAMPLE_SIZE, n)
  const gameIds = new Set(
    Array.from({ length: sampleCount }, (_, i) => {
      const idx = sampleCount === 1 ? 0 : Math.round((i * (n - 1)) / (sampleCount - 1))
      return regularSeasonFinals[idx].id
    })
  )

  const boxscores = await Promise.all(
    [...gameIds].map(id => fetch(`${SITE}/summary?event=${id}`).then(r => (r.ok ? r.json() : null)))
  )

  const byId = new Map()
  for (const box of boxscores) {
    const teamPlayers = box?.boxscore?.players?.find(p => String(p.team?.id) === String(espnTeamId))
    for (const group of (teamPlayers?.statistics || [])) {
      for (const entry of (group.athletes || [])) {
        const a = entry.athlete
        if (a?.id && !byId.has(a.id)) byId.set(a.id, a)
      }
    }
  }
  return [...byId.values()]
}

// Bio (name/height/weight/DOB) barely changes season to season, so it's pulled from the
// season-agnostic athlete endpoint. Stats come from the season-scoped statistics endpoint, which
// — unlike the SITE statistics/byathlete endpoint's teamId filter (silently ignored by ESPN; it
// returns league-wide leaders regardless of team requested) — is genuinely accurate per player
// per season, flattened here across its defensive/offensive/general categories.
async function getAthleteBioAndStats(athleteId, year) {
  const [bioRes, statsRes] = await Promise.all([
    fetch(`${CORE}/athletes/${athleteId}`),
    fetch(`${CORE}/seasons/${year}/types/2/athletes/${athleteId}/statistics`),
  ])
  const bio = bioRes.ok ? await bioRes.json() : {}
  const statsData = statsRes.ok ? await statsRes.json() : null

  const stats = {}
  for (const cat of (statsData?.splits?.categories || [])) {
    for (const stat of (cat.stats || [])) {
      stats[stat.name] = stat.value
    }
  }
  return { bio, stats }
}

// Every roster/bio/boxscore position field ESPN exposes for an individual player only ever
// carries the coarse Guard/Forward/Center category (id 3/7/9), never the specific Point Guard /
// Shooting Guard / Small Forward / Power Forward leaf (confirmed against several players,
// including the CORE athlete profile endpoint directly). The one place the specific leaf
// position exists at all is the team's season depth chart, which lists players under each of
// pg/sg/sf/pf/c. A player can appear under more than one slot (e.g. a combo guard listed at both
// PG and SG) — in that case the specific label is ambiguous, so it's collapsed to the shared
// parent ("Guard" / "Forward"), matching how a real depth chart would be described in one word.
// Players who span slots from different families (rare) fall back to their best-ranked slot.
async function getPositionMap(espnTeamId, year) {
  const res = await fetch(`${CORE}/seasons/${year}/teams/${espnTeamId}/depthcharts`)
  if (!res.ok) return new Map()
  const data = await res.json()
  const groups = data.items?.[0]?.positions || {}

  const FAMILY = { PG: 'guard', SG: 'guard', SF: 'forward', PF: 'forward', C: 'center' }
  const byAthlete = new Map() // athleteId -> [{ abbr, rank }]

  for (const key of Object.keys(groups)) {
    const abbr = groups[key]?.position?.abbreviation
    if (!abbr) continue
    for (const entry of (groups[key].athletes || [])) {
      const id = entry.athlete?.$ref?.match(/athletes\/(\d+)/)?.[1]
      if (!id) continue
      if (!byAthlete.has(id)) byAthlete.set(id, [])
      byAthlete.get(id).push({ abbr, rank: entry.rank ?? 99 })
    }
  }

  const resolved = new Map()
  for (const [id, entries] of byAthlete) {
    const families = new Set(entries.map(e => FAMILY[e.abbr]))
    if (families.size === 1) {
      const leafAbbrs = new Set(entries.map(e => e.abbr))
      if (leafAbbrs.size === 1) {
        resolved.set(id, entries[0].abbr)
      } else {
        const fam = [...families][0]
        resolved.set(id, fam === 'guard' ? 'G' : fam === 'forward' ? 'F' : 'C')
      }
    } else {
      const best = entries.reduce((a, b) => (a.rank <= b.rank ? a : b))
      resolved.set(id, best.abbr)
    }
  }
  return resolved
}

// No age field on the boxscore/bio responses relative to the season played — computed from
// dateOfBirth as of Oct 1 of the season's starting year, same convention as nhl.js.
function ageAsOfSeason(dateOfBirth, year) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const asOf = new Date(Date.UTC(year - 1, 9, 1))
  let age = asOf.getUTCFullYear() - dob.getUTCFullYear()
  const hadBirthday = asOf.getUTCMonth() > dob.getUTCMonth() ||
    (asOf.getUTCMonth() === dob.getUTCMonth() && asOf.getUTCDate() >= dob.getUTCDate())
  if (!hadBirthday) age--
  return age
}

export async function fetchNBAStats(team, year) {
  // ESPN uses different abbreviations for two NBA teams
  const abbr = team.espnAbbr || team.abbr

  // Step 1: resolve ESPN numeric team ID
  const espnId = await getESPNTeamId('basketball', 'nba', abbr)

  // Step 2: reconstruct the season roster from boxscores, the position depth chart, and per-player bio + stats
  const [roster, positionMap] = await Promise.all([
    getSeasonRosterFromBoxscores(espnId, year),
    getPositionMap(espnId, year),
  ])

  if (roster.length === 0) {
    throw new Error(`No NBA roster found for ${team.name} in ${year - 1}-${String(year).slice(2)}. Try a different year.`)
  }

  const details = await Promise.all(roster.map(a => getAthleteBioAndStats(a.id, year)))

  return roster.map((a, i) => {
    const { bio, stats: s } = details[i]
    const age = ageAsOfSeason(bio.dateOfBirth, year)
    return {
      id: a.id,
      jersey: a.jersey || '—',
      name:     bio.fullName || a.displayName || '—',
      position: positionMap.get(String(a.id)) || a.position?.abbreviation || bio.position?.abbreviation || '—',
      age:      age != null ? String(age) : '—',
      height:   bio.displayHeight || '—',
      weight:   bio.displayWeight || '—',
      stats: {
        GP:    fmtInt(s.gamesPlayed),
        PTS:   fmt(s.avgPoints),
        REB:   fmt(s.avgRebounds),
        AST:   fmt(s.avgAssists),
        STL:   fmt(s.avgSteals),
        BLK:   fmt(s.avgBlocks),
        TOV:   fmt(s.avgTurnovers),
        'FG%': fmtPct(s.fieldGoalPct),
        '3P%': fmtPct(s.threePointFieldGoalPct),
        'FT%': fmtPct(s.freeThrowPct),
      },
    }
  })
}
