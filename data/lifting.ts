export const LIFTS = [
  'deadlift',
  'back squat',
  'bench',
  'strict press',
  'weighted pull-up',
  'strict pull-ups',
  'towel hang',
  'dead hang',
] as const

export type Lift = (typeof LIFTS)[number]

export const bodyweight = 180

// Goals at 180 lb BW — "top 10% SF/SOF tactical athlete" targets
export const goals: Record<
  Lift,
  { value: number; unit: 'lb' | 'reps' | 'sec' }
> = {
  deadlift: { value: 400, unit: 'lb' },
  'back squat': { value: 360, unit: 'lb' },
  bench: { value: 265, unit: 'lb' },
  'strict press': { value: 155, unit: 'lb' },
  'weighted pull-up': { value: 90, unit: 'lb' },
  'strict pull-ups': { value: 20, unit: 'reps' },
  'towel hang': { value: 90, unit: 'sec' },
  'dead hang': { value: 120, unit: 'sec' },
}

// Untrained-adult baselines. Used to scale "progress toward goal" so the
// visual reflects training distance rather than raw ratio of current to goal.
export const baselines: Record<Lift, number> = {
  deadlift: 135, // bar + 1pl
  'back squat': 95,
  bench: 95,
  'strict press': 45, // bar
  'weighted pull-up': 0,
  'strict pull-ups': 0,
  'towel hang': 15,
  'dead hang': 30,
}
