export const DISTANCES = ['mile', '5k', '10k', 'half', 'full'] as const
export type Distance = (typeof DISTANCES)[number]

// Strava best_efforts name → our distance key
export const STRAVA_NAME_MAP: Record<string, Distance> = {
  '1 mile': 'mile',
  '5k': '5k',
  '10k': '10k',
  'Half-Marathon': 'half',
  Marathon: 'full',
}

// Goal times in seconds. Edit manually.
export const goals: Record<Distance, number> = {
  mile: 60 * 5.6, // 5:36
  '5k': 60 * 19.5, // 19:30
  '10k': 60 * 41.5, // 41:30
  half: 60 * 60 * 1.55, // 1:33:00
  full: 60 * 60 * 3.2, // 3:12:00
}
