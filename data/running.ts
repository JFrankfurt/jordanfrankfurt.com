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
  mile: 300, // 5:00
  '5k': 1110, // 18:30
  '10k': 2340, // 39:00
  half: 5220, // 1:27:00
  full: 10800, // 3:00:00
}
