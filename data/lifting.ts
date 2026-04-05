export const LIFTS = [
  'deadlift',
  'front squat',
  'back squat',
  'bench',
  'strict press',
  'push press',
  'weighted pull-up',
  'strict pull-ups',
] as const

export type Lift = (typeof LIFTS)[number]

export const bodyweight = 180

// Goals at 180 lb BW — "top 10% SF/SOF tactical athlete" targets
export const goals: Record<Lift, { value: number; unit: 'lb' | 'reps' }> = {
  deadlift: { value: 400, unit: 'lb' },
  'front squat': { value: 305, unit: 'lb' },
  'back squat': { value: 360, unit: 'lb' },
  bench: { value: 265, unit: 'lb' },
  'strict press': { value: 155, unit: 'lb' },
  'push press': { value: 225, unit: 'lb' },
  'weighted pull-up': { value: 90, unit: 'lb' },
  'strict pull-ups': { value: 20, unit: 'reps' },
}
