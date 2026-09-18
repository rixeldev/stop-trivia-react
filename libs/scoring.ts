import type { StopPlayer } from "@/interfaces/Player"
import type { StopGameInputs } from "@/interfaces/StopGameInputs"
import type { StopReviewSubmission, WordReview } from "@/interfaces/Game"

export const SCORE_DIFFERENT_WORDS = 100

export const REJECT_THRESHOLD = 2

export const INPUT_KEYS: (keyof StopGameInputs)[] = [
  "name",
  "lastName",
  "country",
  "color",
  "animal",
  "artist",
  "food",
  "fruit",
  "object",
  "profession",
]

export function normalizeWord(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
}

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

export function computeStopRoundPointsWithReviews(
  players: StopPlayer[],
  reviews: Record<string, StopReviewSubmission>,
): Record<string, number> {
  const totals: Record<string, number> = {}
  const reviewOf = (
    reviewerId: string,
    targetId: string,
    inputKey: keyof StopGameInputs,
  ): WordReview | undefined =>
    reviews[reviewerId]?.[targetId]?.[inputKey]

  for (const inputKey of INPUT_KEYS) {
    const wordOf = (player: StopPlayer) =>
      normalizeWord(player.inputs?.[inputKey])

    const rejectionCount: Record<string, number> = {}
    for (const reviewer of players) {
      if (!reviewer.id) continue
      for (const target of players) {
        if (!target.id || target.id === reviewer.id) continue
        if (reviewOf(reviewer.id, target.id, inputKey)?.accepted === false) {
          rejectionCount[target.id] = (rejectionCount[target.id] ?? 0) + 1
        }
      }
    }

    const rejectThreshold = Math.max(
      1,
      Math.min(REJECT_THRESHOLD, players.length - 1),
    )
    const disqualified = new Set<string>(
      Object.entries(rejectionCount)
        .filter(([, count]) => count >= rejectThreshold)
        .map(([id]) => id),
    )

    const valid = players.filter(
      (player) =>
        player.id &&
        !disqualified.has(player.id) &&
        wordOf(player) !== "",
    )

    if (valid.length === 0) continue

    const parent: Record<string, string> = {}
    for (const player of valid) {
      if (player.id) parent[player.id] = player.id
    }
    const find = (id: string): string => {
      if (parent[id] !== id) parent[id] = find(parent[id])
      return parent[id]
    }
    const union = (a: string, b: string) => {
      const ra = find(a)
      const rb = find(b)
      if (ra !== rb) parent[ra] = rb
    }

    const isSamePair = (a: StopPlayer, b: StopPlayer): boolean => {
      if (!a.id || !b.id) return false
      if (wordOf(a) === wordOf(b)) return true
      const aOnB = reviewOf(a.id, b.id, inputKey)?.same === true
      const bOnA = reviewOf(b.id, a.id, inputKey)?.same === true
      return aOnB && bOnA
    }

    for (let i = 0; i < valid.length; i++) {
      for (let j = i + 1; j < valid.length; j++) {
        if (
          valid[i].id &&
          valid[j].id &&
          isSamePair(valid[i], valid[j])
        ) {
          union(valid[i].id!, valid[j].id!)
        }
      }
    }

    const groups = new Map<string, StopPlayer[]>()
    for (const player of valid) {
      if (!player.id) continue
      const root = find(player.id)
      const list = groups.get(root) ?? []
      list.push(player)
      groups.set(root, list)
    }

    for (const group of groups.values()) {
      const share = pointsForSameWords(group.length, players.length)
      for (const player of group) {
        if (!player.id) continue
        totals[player.id] = (totals[player.id] ?? 0) + share
      }
    }
  }

  return totals
}