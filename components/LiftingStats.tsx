import React from 'react'
import { LIFTS, goals, type Lift } from 'data/lifting'
import prsData from 'data/lifting-prs.json'

const prs = prsData as Record<string, number | string | null>

function formatValue(value: number, lift: Lift): string {
  return lift === 'weighted pull-up' ? `+${value}` : `${value}`
}

export default function LiftingStats() {
  return (
    <div className="text-[0.75em] tabular-nums">
      <div className="mb-1">
        <div className="font-medium">lifting</div>
        <div className="text-gray-400">pr / goal</div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-1.5 gap-y-0.5">
        {LIFTS.map((lift: Lift) => {
          const pr = prs[lift]
          const { value: goalValue } = goals[lift]
          return (
            <React.Fragment key={lift}>
              <span className="text-gray-400">{lift}</span>
              <span className="text-right">
                {pr != null ? formatValue(pr as number, lift) : '—'}
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-300">
                {formatValue(goalValue, lift)}
              </span>
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
