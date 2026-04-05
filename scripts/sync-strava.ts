import { readFileSync, writeFileSync, appendFileSync } from 'fs'
import { execSync } from 'child_process'
import { type Distance } from '../data/running'
import { updatePRs, type BestEffort } from '../utils/updatePRs'

const STRAVA_API = 'https://www.strava.com/api/v3'

const CLIENT_ID = process.env.STRAVA_CLIENT_ID
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
}

interface SummaryActivity {
  id: number
  type: string
  sport_type?: string
  start_date: string
}

interface DetailedActivity {
  id: number
  best_efforts?: BestEffort[]
}

interface PRsFile {
  mile: number | null
  '5k': number | null
  '10k': number | null
  half: number | null
  full: number | null
  lastSyncedAt: string | null
}

async function refreshAccessToken(): Promise<{
  accessToken: string
  newRefreshToken: string
}> {
  const res = await fetch(`${STRAVA_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN!,
    }),
  })

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data: TokenResponse = await res.json()
  return {
    accessToken: data.access_token,
    newRefreshToken: data.refresh_token,
  }
}

function updateGitHubSecret(newToken: string): void {
  if (!process.env.GITHUB_ACTIONS) {
    console.log('Not in GitHub Actions — skipping secret rotation')
    return
  }

  try {
    execSync('gh secret set STRAVA_REFRESH_TOKEN', {
      input: newToken,
      env: { ...process.env, GH_TOKEN: process.env.GH_PAT },
      stdio: ['pipe', 'inherit', 'inherit'],
    })
    console.log('Rotated STRAVA_REFRESH_TOKEN secret')
  } catch {
    console.warn(
      'Failed to rotate STRAVA_REFRESH_TOKEN secret — check GH_PAT permissions'
    )
  }
}

async function stravaFetch<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${STRAVA_API}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const usage = res.headers.get('X-RateLimit-Usage')
  const limit = res.headers.get('X-RateLimit-Limit')
  if (usage && limit) {
    const [shortUsage] = usage.split(',').map(Number)
    const [shortLimit] = limit.split(',').map(Number)
    if (shortUsage >= shortLimit * 0.8) {
      console.log(`Rate limit warning: ${usage} / ${limit} — pausing 60s`)
      await new Promise((r) => setTimeout(r, 60_000))
    }
  }

  if (res.status === 429) {
    console.log('Rate limited — waiting 15 minutes')
    await new Promise((r) => setTimeout(r, 15 * 60_000))
    return stravaFetch(path, accessToken, params)
  }

  if (!res.ok) {
    throw new Error(
      `Strava API error ${res.status} on ${path}: ${await res.text()}`
    )
  }

  return res.json()
}

async function fetchRunActivities(
  accessToken: string,
  after?: string | null
): Promise<SummaryActivity[]> {
  const allRuns: SummaryActivity[] = []
  let page = 1

  const params: Record<string, string> = { per_page: '200' }
  if (after) {
    params.after = String(Math.floor(new Date(after).getTime() / 1000))
  }

  while (true) {
    const activities = await stravaFetch<SummaryActivity[]>(
      '/athlete/activities',
      accessToken,
      { ...params, page: String(page) }
    )

    if (activities.length === 0) break

    const runs = activities.filter(
      (a) =>
        a.type === 'Run' ||
        a.sport_type === 'Run' ||
        a.sport_type === 'TrailRun'
    )
    allRuns.push(...runs)
    console.log(
      `Page ${page}: ${activities.length} activities, ${runs.length} runs`
    )

    if (activities.length < 200) break
    page++
  }

  return allRuns
}

async function fetchBestEfforts(
  activityId: number,
  accessToken: string
): Promise<BestEffort[]> {
  const detail = await stravaFetch<DetailedActivity>(
    `/activities/${activityId}`,
    accessToken,
    { include_all_efforts: 'true' }
  )
  return detail.best_efforts ?? []
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error(
      'Missing required env vars: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN'
    )
    process.exit(1)
  }

  const prsFile: PRsFile = JSON.parse(readFileSync('data/prs.json', 'utf-8'))

  console.log('Refreshing Strava access token...')
  const { accessToken, newRefreshToken } = await refreshAccessToken()
  updateGitHubSecret(newRefreshToken)

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `new_refresh_token=${newRefreshToken}\n`
    )
  }

  console.log(
    `Fetching activities${prsFile.lastSyncedAt ? ` since ${prsFile.lastSyncedAt}` : ' (full sync)'}...`
  )
  const runs = await fetchRunActivities(accessToken, prsFile.lastSyncedAt)
  console.log(`Found ${runs.length} run(s) to process`)

  let currentPRs: Record<Distance, number | null> = {
    mile: prsFile.mile,
    '5k': prsFile['5k'],
    '10k': prsFile['10k'],
    half: prsFile.half,
    full: prsFile.full,
  }
  let anyChanged = false

  for (const run of runs) {
    const efforts = await fetchBestEfforts(run.id, accessToken)
    const { prs: updatedPRs, changed } = updatePRs(currentPRs, efforts)
    if (changed) {
      currentPRs = updatedPRs
      anyChanged = true
    }
  }

  const now = new Date()
  const newData: PRsFile = {
    ...currentPRs,
    lastSyncedAt: now.toISOString(),
  }

  writeFileSync('data/prs.json', JSON.stringify(newData, null, 2) + '\n')
  console.log(
    anyChanged
      ? 'PRs updated and written to data/prs.json'
      : 'No new PRs — lastSyncedAt updated'
  )
}

main().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
