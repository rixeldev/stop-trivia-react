export const SCORE_DIFFERENT_WORDS = 100

export function pointsForSameWords(
  sameCount: number,
  playerCount: number
): number {
  if (sameCount <= 0) return SCORE_DIFFERENT_WORDS
  if (sameCount === 4) return 25
  if (sameCount === 3 && playerCount === 4) return 35
  return Math.round(SCORE_DIFFERENT_WORDS / sameCount)
}

export function computeStopRoundPoints(
  players: { id?: string | null }[],
  scoring: Record<string, boolean>
): Record<string, number> {
  const sameCount = players.filter(
    (player) => player.id && scoring[player.id] === true
  ).length
  const share = pointsForSameWords(sameCount, players.length)
  const points: Record<string, number> = {}

  for (const player of players) {
    if (!player.id) continue
    points[player.id] = scoring[player.id] ? share : SCORE_DIFFERENT_WORDS
  }

  return points
}

export function pointsForOffline(sameWords: boolean): number {
  const sameCount = sameWords ? 1 : 0
  return sameCount === 0
    ? SCORE_DIFFERENT_WORDS
    : pointsForSameWords(sameCount, 1)
}