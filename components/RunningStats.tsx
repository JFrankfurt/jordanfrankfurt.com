import Link from 'next/link'
import React from 'react'
import { DISTANCES, goals, type Distance } from 'data/running'
import prsData from 'data/prs.json'
import { formatTime } from 'utils/formatTime'

const STRAVA_PROFILE = 'https://www.strava.com/athletes/154239818'
const prs = prsData as Record<string, number | string | null>

function formatSyncDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function TickerRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  const syncedAt = prs.lastSyncedAt as string | null
  return (
    <div
      aria-hidden={ariaHidden}
      className={`flex shrink-0 items-center gap-x-6 px-6 ${ariaHidden ? 'motion-reduce:hidden' : ''}`}
    >
      <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
        <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        live · strava
      </span>
      <span className="uppercase tracking-wider opacity-70">
        achieved / goal
      </span>
      {DISTANCES.map((d: Distance) => {
        const pr = prs[d]
        const goal = goals[d]
        return (
          <span key={d} className="flex items-baseline gap-1.5">
            <span className="font-semibold">{d}</span>
            <span>{pr != null ? formatTime(pr as number) : '—'}</span>
            <span className="opacity-70">/ {formatTime(goal)}</span>
          </span>
        )
      })}
      {syncedAt && (
        <span className="opacity-70">synced {formatSyncDate(syncedAt)}</span>
      )}
      <span aria-hidden="true">↗</span>
    </div>
  )
}

export default function RunningStats() {
  return (
    <Link
      href={STRAVA_PROFILE}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Strava live PR sync"
      className="block w-full overflow-hidden bg-strava py-1.5 text-xs tabular-nums text-white no-underline hover:no-underline"
    >
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
        <TickerRow />
        <TickerRow ariaHidden />
      </div>
    </Link>
  )
}
