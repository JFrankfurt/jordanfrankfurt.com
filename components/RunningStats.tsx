import Link from 'next/link'
import React from 'react'
import { DISTANCES, goals, type Distance } from 'data/running'
import prsData from 'data/prs.json'
import { formatTime } from 'utils/formatTime'

const STRAVA_PROFILE = 'https://www.strava.com/athletes/154239818'
const STRAVA_ORANGE = '#FC4C02'
const prs = prsData as Record<string, number | string | null>

function formatSyncDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function RunningStats() {
  const syncedAt = prs.lastSyncedAt as string | null

  return (
    <div className="text-[0.75em] tabular-nums">
      <div className="mb-1">
        <div className="font-medium">running</div>
        <div className="text-gray-400">pr / goal</div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-1.5 gap-y-0.5">
        {DISTANCES.map((d: Distance) => {
          const pr = prs[d]
          const goal = goals[d]
          return (
            <React.Fragment key={d}>
              <span className="text-gray-400">{d}</span>
              <span className="text-right">
                {pr != null ? formatTime(pr as number) : '—'}
              </span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-300">{formatTime(goal)}</span>
            </React.Fragment>
          )
        })}
      </div>
      <Link
        href={STRAVA_PROFILE}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 flex items-center gap-1 text-gray-500 no-underline hover:text-gray-700"
        aria-label="Live PR sync from Strava"
      >
        <span
          className="relative inline-flex h-1.5 w-1.5 shrink-0"
          aria-hidden="true"
        >
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ backgroundColor: STRAVA_ORANGE }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: STRAVA_ORANGE }}
          />
        </span>
        <span style={{ color: STRAVA_ORANGE }} className="font-medium">
          live · strava
        </span>
        {syncedAt && (
          <span className="text-gray-400">{formatSyncDate(syncedAt)}</span>
        )}
        <span className="text-gray-400">↗</span>
      </Link>
    </div>
  )
}
