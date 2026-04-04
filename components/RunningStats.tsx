import React from 'react'
import { DISTANCES, goals, type Distance } from 'data/running'
import prsData from 'data/prs.json'
import { formatTime } from 'utils/formatTime'

const prs = prsData as Record<string, number | string | null>

export default function RunningStats() {
  const hasPRs = DISTANCES.some((d) => prs[d] != null)
  if (!hasPRs) return null

  return (
    <div className="w-full max-w-[500px] sm:max-w-[600px] md:max-w-[650px] lg:max-w-[800px] mb-8 px-2">
      <div className="space-y-1 tabular-nums text-[0.85em]">
        {DISTANCES.map((d: Distance) => {
          const pr = prs[d]
          const goal = goals[d]
          return (
            <div key={d} className="flex justify-between">
              <span className="text-gray-400 w-10">{d}</span>
              <span>
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
    </div>
  )
}
