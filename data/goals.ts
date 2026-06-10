import {
  baselines as liftingBaselines,
  goals as liftingGoals,
  type Lift,
} from './lifting'
import liftingPrsRaw from './lifting-prs.json'
import {
  baselines as runningBaselines,
  goals as runningGoals,
  type Distance,
} from './running'
import runningPrsRaw from './prs.json'

export type Status = 'Active' | 'Untested'

export interface Goal {
  domain: string
  current: string
  goal: string
  status: Status
  /** 0–1 progress toward goal. Only set for numerically measurable rows. */
  progress?: number
}

export interface CategorySection {
  title: string
  description?: string
  rows: Goal[]
}

const liftingPrs = liftingPrsRaw as Record<Lift, number | null>
const runningPrs = runningPrsRaw as Record<Distance, number | null> & {
  lastSyncedAt?: string
}

function formatSeconds(s: number): string {
  if (s < 60) return `${s} sec`
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatLiftValue(lift: Lift, value: number): string {
  const { unit } = liftingGoals[lift]
  if (lift === 'weighted pull-up') return `+${value} ${unit}`
  return `${value} ${unit}`
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Progress along the training span baseline → goal (value-up: higher better). */
function spanProgressUp(
  current: number,
  baseline: number,
  goal: number
): number {
  return clamp01((current - baseline) / (goal - baseline))
}

/** Progress along the training span baseline → goal (value-down: lower better). */
function spanProgressDown(
  current: number,
  baseline: number,
  goal: number
): number {
  return clamp01((baseline - current) / (baseline - goal))
}

function liftRow(domain: string, lift: Lift): Goal {
  const current = liftingPrs[lift]
  const { value: goalVal } = liftingGoals[lift]
  const baseline = liftingBaselines[lift]
  return {
    domain,
    current: current != null ? formatLiftValue(lift, current) : 'Untested',
    goal: formatLiftValue(lift, goalVal),
    status: current != null ? 'Active' : 'Untested',
    progress:
      current != null ? spanProgressUp(current, baseline, goalVal) : undefined,
  }
}

function runRow(
  domain: string,
  distance: Distance,
  fallbackCurrent = 'Pending sync'
): Goal {
  const current = runningPrs[distance]
  const goalSec = runningGoals[distance]
  const baselineSec = runningBaselines[distance]
  return {
    domain,
    current: current != null ? formatSeconds(current) : fallbackCurrent,
    goal: `Sub-${formatSeconds(goalSec)}`,
    status: current != null ? 'Active' : 'Untested',
    progress:
      current != null
        ? spanProgressDown(current, baselineSec, goalSec)
        : undefined,
  }
}

export const sections: CategorySection[] = [
  {
    title: 'Skill',
    rows: [
      {
        domain: 'BJJ',
        current: 'Purple',
        goal: 'Black',
        status: 'Active',
      },
      {
        domain: 'Judo',
        current: 'White',
        goal: 'Shodan',
        status: 'Untested',
      },
      {
        domain: 'Striking',
        current: 'None',
        goal: '2 yr cumulative training',
        status: 'Untested',
      },
      {
        domain: 'USPSA pistol',
        current: 'Unclassified',
        goal: 'A class (Carry Optics)',
        status: 'Untested',
      },
      {
        domain: 'Run-n-gun (WTF Biathlon)',
        current: '62/96, Apr 2026 AR',
        goal: 'Top 20% overall',
        status: 'Active',
      },
      {
        domain: 'NRL Hunter',
        current: 'Untested',
        goal: 'Top 25% in division',
        status: 'Untested',
      },
    ],
  },
  {
    title: 'Strength',
    rows: [
      liftRow('Deadlift', 'deadlift'),
      liftRow('Back squat', 'back squat'),
      liftRow('Bench', 'bench'),
      liftRow('Strict press', 'strict press'),
      liftRow('Weighted pull-up', 'weighted pull-up'),
      liftRow('Strict pull-ups', 'strict pull-ups'),
      liftRow('Towel hang', 'towel hang'),
      liftRow('Dead hang', 'dead hang'),
      {
        domain: 'Farmer carry',
        current: 'Untested',
        goal: '300 lb total × 100 yd',
        status: 'Untested',
      },
      {
        domain: 'Sandbag carry',
        current: 'Untested',
        goal: '200 lb bear-hug × 100 yd',
        status: 'Untested',
      },
      {
        domain: 'Bodyweight',
        current: '184 lb',
        goal: '195 lb',
        status: 'Active',
        // Baseline 165 lb = lean untrained adult of similar frame.
        progress: spanProgressUp(184, 165, 195),
      },
      {
        domain: 'Body fat',
        current: '10.3%',
        goal: '≤ 13%',
        status: 'Active',
        // Ceiling metric: at-or-under goal = full progress; over goal scales down.
        progress: 10.3 <= 13 ? 1 : clamp01(13 / 10.3),
      },
    ],
  },
  {
    title: 'Speed',
    rows: [
      {
        domain: '40-yard dash',
        current: '5.6 sec',
        goal: '4.8 sec',
        status: 'Active',
      },
      runRow('400m', '400m'),
    ],
  },
  {
    title: 'Endurance',
    rows: [
      runRow('5k', '5k'),
      runRow('10k', '10k'),
      {
        domain: 'Ruck',
        current: 'Untested',
        goal: '12 mi @ 45 lb, sub-3:00',
        status: 'Untested',
      },
    ],
  },
  {
    title: 'Mobility',
    description:
      'Aspirational movement standards measured quarterly with fixed video angles.',
    rows: [
      {
        domain: 'Pancake',
        current: 'Untested',
        goal: 'Sternum to floor at fixed straddle angle',
        status: 'Untested',
      },
      {
        domain: 'Skin-the-cat',
        current: 'Untested',
        goal: '3 controlled ring reps to German hang and back',
        status: 'Untested',
      },
      {
        domain: 'Bridge',
        current: 'Untested',
        goal: '30-sec full bridge, straight arms, hands ≤26" from heels',
        status: 'Untested',
      },
      {
        domain: 'Overhead squat',
        current: 'Untested',
        goal: '5 full-depth reps with empty bar',
        status: 'Untested',
      },
    ],
  },
]
