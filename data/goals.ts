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
        current: 'Purple, comp-tested',
        goal: 'Black, comp-hardened',
        status: 'Active',
      },
      {
        domain: 'Standing grappling',
        current: 'White / untrained',
        goal: 'Judo Shodan',
        status: 'Untested',
      },
      {
        domain: 'Striking',
        current: 'None',
        goal: '2 yr cumulative training + safe sparring',
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
        current: '182 lb',
        goal: '195 lb',
        status: 'Active',
        // Baseline 165 lb = lean untrained adult of similar frame.
        progress: spanProgressUp(182, 165, 195),
      },
      {
        domain: 'Body fat',
        current: '11%',
        goal: '≤ 13%',
        status: 'Active',
        // Ceiling metric: at-or-under goal = full progress; over goal scales down.
        progress: 11 <= 13 ? 1 : clamp01(13 / 11),
      },
    ],
  },
  {
    title: 'Speed',
    rows: [
      {
        domain: '40-yard dash',
        current: 'Untested',
        goal: '4.8 sec',
        status: 'Untested',
      },
      {
        domain: '5-10-5 shuttle',
        current: 'Untested',
        goal: 'Sub-5.0 sec',
        status: 'Untested',
      },
      runRow('400m', '400m'),
    ],
  },
  {
    title: 'Endurance',
    rows: [
      runRow('5k', '5k'),
      runRow('10k', '10k'),
      runRow('Half marathon', 'half'),
      {
        domain: 'Ruck',
        current: 'Untested',
        goal: '12 mi @ 45 lb, sub-3:00 (SFAS std)',
        status: 'Untested',
      },
    ],
  },
  {
    title: 'Durability minimums',
    rows: [
      {
        domain: 'Deep squat',
        current: 'Untested',
        goal: '5 min relaxed deep squat, heels down, no pain',
        status: 'Untested',
      },
      {
        domain: 'Overhead position',
        current: 'Untested',
        goal: 'Shoulder-width PVC pass-through + pain-free loaded overhead squat pattern',
        status: 'Untested',
      },
      {
        domain: 'Hip extension',
        current: 'Untested',
        goal: 'Couch stretch 2 min/side without lumbar compensation',
        status: 'Untested',
      },
      {
        domain: 'Passive hang',
        current: 'Untested',
        goal: '2 min passive hang; stretch 60 sec one-arm aggregate/side',
        status: 'Untested',
      },
      {
        domain: 'Neck',
        current: 'Untested',
        goal: 'Full pain-free ROM + trained isometric flexion/extension/lateral strength',
        status: 'Untested',
      },
      {
        domain: 'Ankles/calves',
        current: 'Untested',
        goal: 'Knee-to-wall symmetry + resilient calves/Achilles under running volume',
        status: 'Untested',
      },
    ],
  },
]
