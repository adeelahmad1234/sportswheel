// Different position groups (skaters/goalies, hitters/pitchers) carry different stat shapes.
// Shared by StatsTable and GuessGame so both group rosters the same way — by each player's own
// Object.keys(stats) signature, not by assuming everyone on the roster shares one shape.

export function labelForStatKeys(keys) {
  if (keys.includes('GAA') || keys.includes('SV%')) return 'Goalies'
  if (keys.includes('ERA') || keys.includes('WHIP')) return 'Pitchers'
  if (keys.includes('TOI/G')) return 'Skaters'
  if (keys.includes('AVG') && keys.includes('OPS')) return 'Hitters'
  return 'Players'
}

export function groupByStatShape(players) {
  const byShape = new Map()
  for (const p of players) {
    const keys = Object.keys(p.stats || {})
    const signature = keys.join('|')
    if (!byShape.has(signature)) byShape.set(signature, { statKeys: keys, players: [] })
    byShape.get(signature).players.push(p)
  }
  return [...byShape.values()]
}
