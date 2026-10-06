import { execFileSync } from 'child_process'
import { readFileSync, renameSync, writeFileSync } from 'fs'
import { createStravaClient } from './strava/client'
import { runSync } from './strava/run'
import { type PRsFile } from './strava/sync'

const PRS_PATH = 'data/prs.json'

async function main() {
  const env = process.env
  const client = createStravaClient({
    fetch,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: Date.now,
    secrets: [
      env.STRAVA_CLIENT_SECRET,
      env.STRAVA_REFRESH_TOKEN,
      env.GH_PAT,
    ].filter((value): value is string => Boolean(value)),
  })

  await runSync({
    client,
    env,
    now: Date.now,
    readPRs: () => JSON.parse(readFileSync(PRS_PATH, 'utf-8')) as PRsFile,
    writePRs: (data) => {
      const tmp = `${PRS_PATH}.tmp`
      writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
      renameSync(tmp, PRS_PATH)
    },
    runSecret: (command, args, { input, env: childEnv, timeoutMs }) => {
      execFileSync(command, args, {
        input,
        env: childEnv,
        timeout: timeoutMs,
        stdio: ['pipe', 'inherit', 'inherit'],
      })
    },
  })
}

main().catch((err) => {
  console.error('Sync failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
