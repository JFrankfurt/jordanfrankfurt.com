import {
  ConstraintConfig,
  FixedSession,
  InterferenceRule,
  NutritionConfig,
  ProgressionConfig,
  RunCommuteConfig,
} from './types'

export const DEFAULT_PLAN_DURATION_WEEKS = 12
export const MAX_PLAN_DURATION_WEEKS = 156
export const DEFAULT_MAX_DAILY_TSS = 150
export const DEFAULT_MAX_WEEKLY_TSS = 700
export const DEFAULT_MAX_WEEKLY_IMPACT = 45
export const DELOAD_FREQUENCY_WEEKS = 4
export const DELOAD_VOLUME_PCT = 0.6
export const WEEKLY_VOLUME_INCREASE_PCT = 0.03
export const RUN_COMMUTE_DISTANCE_MILES = 4.25
export const ACWR_SWEET_SPOT = { min: 0.8, max: 1.3 }
export const PROTEIN_PER_KG = 2.2
export const TIMEZONE = 'America/Chicago'

export const READINESS_MODIFIERS: Record<string, number> = {
  green: 1.0,
  yellow: 0.85,
  red: 0.5,
}

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DEFAULT_INTERFERENCE_RULES: InterferenceRule[] = [
  {
    source: 'running',
    target: 'bjj',
    windowHours: 48,
    severity: 'hard',
    description: 'No VO2 running within 48h of hard BJJ',
  },
  {
    source: 'lifting',
    target: 'running',
    windowHours: 0,
    severity: 'hard',
    description: 'No heavy squat same day as hard running',
  },
  {
    source: 'lifting',
    target: 'bjj',
    windowHours: 24,
    severity: 'soft',
    description: 'Heavy eccentrics before BJJ affect performance',
  },
  {
    source: 'isometrics',
    target: 'lifting',
    windowHours: 4,
    severity: 'soft',
    description: 'Isometrics before strength may fatigue',
  },
  {
    source: 'endRange',
    target: 'lifting',
    windowHours: 2,
    severity: 'soft',
    description: 'End-range before strength may reduce stability',
  },
]

export const DEFAULT_FIXED_SESSIONS: Partial<FixedSession>[] = [
  { dayOfWeek: 2, startTime: '06:30', endTime: '08:00', isProtected: false },
  { dayOfWeek: 4, startTime: '06:30', endTime: '08:00', isProtected: false },
  { dayOfWeek: 5, startTime: '06:30', endTime: '07:30', isProtected: false },
  { dayOfWeek: 6, startTime: '11:00', endTime: '13:00', isProtected: true },
  { dayOfWeek: 1, startTime: '07:00', endTime: '08:30', isProtected: false },
  { dayOfWeek: 3, startTime: '07:00', endTime: '08:30', isProtected: false },
]

export const DEFAULT_RUN_COMMUTE: RunCommuteConfig = {
  distanceMiles: RUN_COMMUTE_DISTANCE_MILES,
  daysAvailable: [1, 3, 5, 6],
}

export const DEFAULT_CONSTRAINT_CONFIG: ConstraintConfig = {
  maxDailyTSS: DEFAULT_MAX_DAILY_TSS,
  maxWeeklyTSS: DEFAULT_MAX_WEEKLY_TSS,
  maxWeeklyImpact: DEFAULT_MAX_WEEKLY_IMPACT,
  interferenceRules: DEFAULT_INTERFERENCE_RULES,
  saturdayProtected: true,
  noEccentricDays: [4, 5],
}

export const DEFAULT_NUTRITION_CONFIG: NutritionConfig = {
  currentWeightKg: 85,
  goalWeightKg: 88,
  bodyFatPercent: null,
  heightCm: 180,
  age: 30,
  weeklyWeightChangeKg: 0.25,
}

export const DEFAULT_PROGRESSION_CONFIG: ProgressionConfig = {
  weeklyVolumeIncreasePct: WEEKLY_VOLUME_INCREASE_PCT,
  deloadFrequencyWeeks: DELOAD_FREQUENCY_WEEKS,
  deloadVolumePct: DELOAD_VOLUME_PCT,
}
