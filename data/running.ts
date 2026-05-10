export const DISTANCES = ['400m', '5k', '10k', 'half'] as const
export type Distance = (typeof DISTANCES)[number]

// Strava best_efforts name → our distance key
export const STRAVA_NAME_MAP: Record<string, Distance> = {
  '5k': '5k',
  '5K': '5k',
  '10k': '10k',
  '10K': '10k',
  'Half-Marathon': 'half',
}

// Goal times in seconds. Edit manually.
export const goals: Record<Distance, number> = {
  '400m': 60,
  '5k': 60 * 19.5, // 19:30
  '10k': 40 * 60, // 40:00
  half: 60 * 60 + 35 * 60, // 1:35:00
}

// Untrained-adult baseline times in seconds. Used to scale "progress toward
// goal" so the visual reflects how far the remaining training gap is, not raw
// ratio of goal to current.
export const baselines: Record<Distance, number> = {
  '400m': 90, // 1:30 — adult who can sprint
  '5k': 30 * 60, // 30:00 — recreational adult who can jog
  '10k': 65 * 60, // 1:05:00
  half: 150 * 60, // 2:30:00
}
