import React from 'react'
import { DISTANCES, goals, type Distance } from 'data/running'
import prsData from 'data/prs.json'
import { formatTime } from 'utils/formatTime'

const prs = prsData as Record<string, number | string | null>

export default function RunningStats() {
  const hasPRs = DISTANCES.some((d) => prs[d] != null)
  if (!hasPRs) return null

  return (
    <div className="space-y-1 text-[0.75em] tabular-nums">
      {DISTANCES.map((d: Distance) => {
        const pr = prs[d]
        const goal = goals[d]
        return (
          <div key={d} className="flex justify-between gap-2">
            <span className="text-gray-400">{d}</span>
            <span className="whitespace-nowrap">
              {pr != null ? (
                <>
                  {formatTime(pr as number)}
                  <span className="text-gray-300"> / {formatTime(goal)}</span>
                </>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
