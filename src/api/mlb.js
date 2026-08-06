const BASE = 'https://statsapi.mlb.com/api/v1'

export async function fetchMLBStats(team, year) {
  const teamId = team.id

  // Use hydration to embed per-player stats directly in the roster response.
  // `stats(...)` must be nested inside `person(...)` — as a sibling it is silently dropped.
  const hydrate = `person(fullName,currentAge,height,weight,stats(type=season,season=${year},group=[hitting,pitching],gameType=R))`

  const rosterRes = await fetch(
    `${BASE}/teams/${teamId}/roster?season=${year}&rosterType=active&hydrate=${encodeURIComponent(hydrate)}`
  )
  if (!rosterRes.ok) throw new Error(`MLB roster error: ${rosterRes.status}`)
  const rosterData = await rosterRes.json()
  const roster = rosterData.roster || []

  if (roster.length === 0) throw new Error(`No MLB roster found for ${team.name} in ${year}.`)

  return roster.map(entry => {
    const p   = entry.person || {}
    const pos = entry.position?.abbreviation || '—'
    const isPitcher = ['P', 'SP', 'RP', 'CL'].includes(pos)

    // Stats are embedded in person.stats as an array of stat groups; the actual
    // numbers live at group.splits[0].stat, not group.stats
    const statGroups = p.stats || []
    const hitting  = statGroups.find(g => g.group?.displayName === 'hitting')?.splits?.[0]?.stat  || {}
    const pitching = statGroups.find(g => g.group?.displayName === 'pitching')?.splits?.[0]?.stat || {}

    const stats = isPitcher
      ? {
          W:      pitching.wins           ?? '—',
          L:      pitching.losses         ?? '—',
          ERA:    pitching.era            ?? '—',
          G:      pitching.gamesPitched   ?? '—',
          IP:     pitching.inningsPitched ?? '—',
          SO:     pitching.strikeOuts     ?? '—',
          BB:     pitching.baseOnBalls    ?? '—',
          WHIP:   pitching.whip           ?? '—',
          'K/9':  pitching.strikeoutsPer9Inn ?? '—',
          'BB/9': pitching.walksPer9Inn      ?? '—',
        }
      : {
          G:   hitting.gamesPlayed ?? '—',
          AB:  hitting.atBats      ?? '—',
          H:   hitting.hits        ?? '—',
          HR:  hitting.homeRuns    ?? '—',
          RBI: hitting.rbi         ?? '—',
          AVG: hitting.avg         ?? '—',
          OBP: hitting.obp         ?? '—',
          SLG: hitting.slg         ?? '—',
          OPS: hitting.ops         ?? '—',
          SB:  hitting.stolenBases ?? '—',
        }

    return {
      id:       p.id,
      jersey:   entry.jerseyNumber || '—',
      name:     p.fullName || '—',
      position: pos,
      age:      p.currentAge ? String(p.currentAge) : '—',
      height:   p.height    || '—',
      weight:   p.weight    ? `${p.weight} lbs` : '—',
      stats,
    }
  })
}
