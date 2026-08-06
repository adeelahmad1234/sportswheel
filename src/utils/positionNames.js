// Position abbreviations mean different things per sport (e.g. "C" is Center in NBA/NHL but
// Catcher in MLB, "G" is Guard in NBA but Goalie in NHL) — kept as separate per-league maps
// rather than one global lookup.

const NBA = {
  PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward', PF: 'Power Forward', C: 'Center',
  G: 'Guard', F: 'Forward',
}

const NHL = {
  C: 'Center', LW: 'Left Wing', RW: 'Right Wing', D: 'Defenseman', G: 'Goalie',
}

const MLB = {
  P: 'Pitcher', C: 'Catcher', '1B': 'First Base', '2B': 'Second Base', '3B': 'Third Base',
  SS: 'Shortstop', LF: 'Left Field', CF: 'Center Field', RF: 'Right Field', OF: 'Outfield',
  DH: 'Designated Hitter',
}

const MAPS = { NBA, NHL, MLB }

export function fullPositionName(leagueId, abbr) {
  if (!abbr || abbr === '—') return null
  return MAPS[leagueId]?.[abbr] || abbr
}
