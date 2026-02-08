// Enums/Unions
export type Modality =
  | 'bjj'
  | 'running'
  | 'lifting'
  | 'isometrics'
  | 'endRange'
  | 'recovery'
export type Intensity = 'easy' | 'moderate' | 'hard' | 'max'
export type ReadinessZone = 'green' | 'yellow' | 'red'

// Core types
export interface SessionTemplate {
  id: string
  name: string
  modality: Modality
  intensity: Intensity
  durationMinutes: number
  tss: number
  isEccentric: boolean
  isImpact: boolean
  muscleGroups: string[]
  description: string
}

export interface FixedSession {
  dayOfWeek: number // 1=Monday, 7=Sunday (luxon ISO weekday)
  startTime: string // "06:30"
  endTime: string // "08:00"
  template: SessionTemplate
  isProtected: boolean
}

export interface PlannedSession {
  template: SessionTemplate
  startTime: string | null
  adjustedVolume: number // multiplier, 1.0 = normal
  adjustedIntensity: number // multiplier
  reason: string
}

export interface NutritionTargets {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

export interface DayPlan {
  date: string // ISO date
  sessions: PlannedSession[]
  totalTSS: number
  readiness: ReadinessZone | null
  nutritionTargets: NutritionTargets
  annotations: string[]
}

export interface WeekPlan {
  weekNumber: number
  startDate: string
  days: DayPlan[]
  weeklyTSS: number
  acwr: number
}

export interface PlanMetadata {
  generatedAt: string
  solverDurationMs: number
  constraintViolations: string[]
}

export interface TrainingPlan {
  id: string
  createdAt: string
  config: PlanConfig
  weeks: WeekPlan[]
  metadata: PlanMetadata
}

export interface RunCommuteConfig {
  distanceMiles: number
  daysAvailable: number[] // day of week numbers
}

export interface InterferenceRule {
  source: Modality
  target: Modality
  windowHours: number
  severity: 'hard' | 'soft'
  description: string
}

export interface ConstraintConfig {
  maxDailyTSS: number
  maxWeeklyTSS: number
  maxWeeklyImpact: number
  interferenceRules: InterferenceRule[]
  saturdayProtected: boolean
  noEccentricDays: number[] // days before protected day
}

export interface NutritionConfig {
  currentWeightKg: number
  goalWeightKg: number
  bodyFatPercent: number | null
  heightCm: number
  age: number
  weeklyWeightChangeKg: number
}

export interface ProgressionConfig {
  weeklyVolumeIncreasePct: number
  deloadFrequencyWeeks: number
  deloadVolumePct: number
}

export interface PlanConfig {
  startDate: string
  durationWeeks: number
  fixedSessions: FixedSession[]
  enabledModalities: Modality[]
  runCommute: RunCommuteConfig
  constraints: ConstraintConfig
  nutritionConfig: NutritionConfig
  progressionConfig: ProgressionConfig
}

export interface ReadinessLog {
  date: string
  zone: ReadinessZone
  notes: string
  bodyWeightKg: number | null
  sleepHours: number | null
}

// State types for React Context
export interface TrainingState {
  plan: TrainingPlan | null
  config: PlanConfig
  readinessLogs: ReadinessLog[]
  isGenerating: boolean
  isLoading: boolean
  error: string | null
  selectedDate: string | null
  activeView: 'calendar' | 'today'
}

// Action types for reducer (discriminated union)
export type TrainingAction =
  | { type: 'LOAD_PLAN'; payload: TrainingPlan }
  | { type: 'GENERATE_PLAN_START' }
  | { type: 'GENERATE_PLAN_SUCCESS'; payload: TrainingPlan }
  | { type: 'GENERATE_PLAN_ERROR'; payload: string }
  | { type: 'LOG_READINESS'; payload: ReadinessLog }
  | { type: 'UPDATE_CONFIG'; payload: Partial<PlanConfig> }
  | { type: 'SET_SELECTED_DATE'; payload: string | null }
  | { type: 'SET_VIEW'; payload: 'calendar' | 'today' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_READINESS_LOGS'; payload: ReadinessLog[] }
  | { type: 'LOAD_CONFIG'; payload: PlanConfig }
