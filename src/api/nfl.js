import { getESPNTeamId, getESPNRoster } from './espn.js'

export async function fetchNFLStats(team, year) {
  const abbr = team.espnAbbr || team.abbr

  // Step 1: ESPN team ID
  const espnId = await getESPNTeamId('football', 'nfl', abbr)

  // year = ending year of season (e.g. 2022 = 2021-22 season)
  // ESPN NFL season param = starting/fall year → subtract 1
  const espnSeason = year - 1
  let athletes = await getESPNRoster('football', 'nfl', espnId, espnSeason)

  if (athletes.length === 0) {
    athletes = await getESPNRoster('football', 'nfl', espnId, null)
  }

  if (athletes.length === 0) {
    throw new Error(`No NFL roster found for ${team.name} in ${year - 1}-${String(year).slice(2)}. Try a different year.`)
  }

  return athletes.map(a => ({
    id:       a.id,
    jersey:   a.jersey || '—',
    name:     a.fullName || a.displayName || '—',
    position: a.position?.abbreviation || '—',
    age:      a.age ? String(a.age) : '—',
    height:   a.displayHeight || '—',
    weight:   a.displayWeight || '—',
    stats: {
      Experience: a.experience?.years != null
        ? (a.experience.years === 0 ? 'Rookie' : `${a.experience.years} yr`)
        : '—',
      College: a.college?.name
        ? a.college.name.length > 16
          ? a.college.name.substring(0, 14) + '…'
          : a.college.name
        : '—',
      Status: a.status?.name || 'Active',
    },
  }))
}
