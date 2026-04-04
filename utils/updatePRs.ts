import { DISTANCES, STRAVA_NAME_MAP, type Distance } from '../data/running'

export interface BestEffort {
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  pr_rank: number | null
}

/**
 * Compare best efforts against current PRs and return updated PRs.
 * Only updates when a new time is strictly faster (lower).
 */
export function updatePRs(
  currentPRs: Record<Distance, number | null>,
  bestEfforts: BestEffort[]
): { prs: Record<Distance, number | null>; changed: boolean } {
  const updated = { ...currentPRs }
  let changed = false

  for (const effort of bestEfforts) {
    const distance = STRAVA_NAME_MAP[effort.name]
    if (!distance) continue
    if (!DISTANCES.includes(distance)) continue

    const time = effort.moving_time
    const current = updated[distance]
    if (current === null || time < current) {
      updated[distance] = time
      changed = true
    }
  }

  return { prs: updated, changed }
}
