import { type Distance } from '../../data/running'
import { updatePRs, type BestEffort } from '../../utils/updatePRs'
import { type StravaClient } from './client'

const PAGE_SIZE = 200
const MAX_PAGES = 50
// Strava filters by activity start time, so late uploads start before the cursor.
const LOOKBACK_MS = 24 * 60 * 60_000

export interface SummaryActivity {
  id: number
  type: string
  sport_type?: string
  start_date: string
}

interface DetailedActivity {
  best_efforts?: BestEffort[]
}

export interface PRsFile {
  '400m': number | null
  '5k': number | null
  '10k': number | null
  half: number | null
  lastSyncedAt: string | null
}

export interface SyncDeps {
  client: Pick<StravaClient, 'getJson'>
  now: () => number
  readPRs: () => PRsFile
  writePRs: (data: PRsFile) => void
}

export interface SyncResult {
  data: PRsFile
  changed: boolean
  runCount: number
}

function isRun(activity: SummaryActivity): boolean {
  return (
    activity.type === 'Run' ||
    activity.sport_type === 'Run' ||
    activity.sport_type === 'TrailRun'
  )
}

export function afterTimestamp(lastSyncedAt: string | null): string | null {
  if (!lastSyncedAt) return null
  const ms = Date.parse(lastSyncedAt)
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid lastSyncedAt in prs.json: ${lastSyncedAt}`)
  }
  return String(Math.max(0, Math.floor((ms - LOOKBACK_MS) / 1000)))
}

export async function fetchRunActivities(
  client: Pick<StravaClient, 'getJson'>,
  accessToken: string,
  after: string | null
): Promise<SummaryActivity[]> {
  const allRuns: SummaryActivity[] = []

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params: Record<string, string> = {
      per_page: String(PAGE_SIZE),
      page: String(page),
    }
    if (after) params.after = after

    const activities = await client.getJson<SummaryActivity[]>(
      '/athlete/activities',
      accessToken,
      params
    )
    if (activities.length === 0) return allRuns

    const runs = activities.filter(isRun)
    allRuns.push(...runs)
    console.log(
      `Page ${page}: ${activities.length} activities, ${runs.length} runs`
    )

    if (activities.length < PAGE_SIZE) return allRuns
  }

  throw new Error(`Activity list exceeded ${MAX_PAGES} pages`)
}

async function fetchBestEfforts(
  client: Pick<StravaClient, 'getJson'>,
  activityId: number,
  accessToken: string
): Promise<BestEffort[]> {
  const detail = await client.getJson<DetailedActivity>(
    `/activities/${activityId}`,
    accessToken,
    { include_all_efforts: 'true' }
  )
  return detail.best_efforts ?? []
}

// prs.json is written only after every request succeeds, so a failed run
// leaves the old lastSyncedAt in place. The new cursor is the start time of
// this run, so activities created while it runs are fetched next time.
export async function syncPRs(
  accessToken: string,
  { client, now, readPRs, writePRs }: SyncDeps
): Promise<SyncResult> {
  const startedAt = new Date(now()).toISOString()
  const prsFile = readPRs()
  const after = afterTimestamp(prsFile.lastSyncedAt)

  console.log(
    `Fetching activities${prsFile.lastSyncedAt ? ` since ${prsFile.lastSyncedAt}` : ' (full sync)'}...`
  )
  const runs = await fetchRunActivities(client, accessToken, after)
  console.log(`Found ${runs.length} run(s) to process`)

  let currentPRs: Record<Distance, number | null> = {
    '400m': prsFile['400m'],
    '5k': prsFile['5k'],
    '10k': prsFile['10k'],
    half: prsFile.half,
  }
  let anyChanged = false

  for (const run of runs) {
    const efforts = await fetchBestEfforts(client, run.id, accessToken)
    console.log(
      `Activity ${run.id} best efforts: ${efforts.map((e) => `${e.name}=${e.moving_time}s`).join(', ') || '(none)'}`
    )
    const { prs: updatedPRs, changed } = updatePRs(currentPRs, efforts)
    if (changed) {
      currentPRs = updatedPRs
      anyChanged = true
    }
  }

  const data: PRsFile = { ...currentPRs, lastSyncedAt: startedAt }
  writePRs(data)
  console.log(
    anyChanged
      ? 'PRs updated and written to data/prs.json'
      : 'No new PRs — lastSyncedAt updated'
  )
  return { data, changed: anyChanged, runCount: runs.length }
}
