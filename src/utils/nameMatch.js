// Guess-matching for GuessGame: accepts a full name or a last-name-only guess, but never a
// first-name-only guess. Suffixes (Jr, Sr, II, III, IV) are stripped before taking the "last
// name" so e.g. "Otto Porter Jr." is guessable as "Porter", not "Jr".

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v'])

function normalize(s) {
  return (s || '').toLowerCase().trim().replace(/[^a-z0-9\s'-]/g, '').replace(/\s+/g, ' ')
}

function nameForms(fullName) {
  const parts = normalize(fullName).split(' ').filter(Boolean)
  const core = (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1])) ? parts.slice(0, -1) : parts
  return {
    full: parts.join(' '),
    core: core.join(' '),
    last: core[core.length - 1] || '',
  }
}

// Returns every player from `players` (excluding ids in `guessedIds`) that the guess resolves —
// a full name always resolves at most one player, but a last-name-only guess resolves *every*
// remaining player with that last name at once (e.g. both Antetokounmpos on a shared roster),
// rather than refusing to match because it's "ambiguous". Returns [] for no match.
export function findGuessMatches(input, players, guessedIds) {
  const norm = normalize(input)
  if (!norm) return []
  const remaining = players.filter(p => !guessedIds.has(p.id))

  const fullMatch = remaining.find(p => {
    const { full, core } = nameForms(p.name)
    return norm === full || norm === core
  })
  if (fullMatch) return [fullMatch]

  return remaining.filter(p => nameForms(p.name).last === norm)
}
