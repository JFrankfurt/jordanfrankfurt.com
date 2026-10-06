import { type StravaClient } from './client'
import { rotateRefreshTokenSecret, type SecretRunner } from './secret'
import { syncPRs, type SyncDeps, type SyncResult } from './sync'

export interface RunDeps extends Omit<SyncDeps, 'client'> {
  client: StravaClient
  env: NodeJS.ProcessEnv
  runSecret: SecretRunner
}

export const REQUIRED_ENV = [
  'STRAVA_CLIENT_ID',
  'STRAVA_CLIENT_SECRET',
  'STRAVA_REFRESH_TOKEN',
] as const

export async function runSync(deps: RunDeps): Promise<SyncResult> {
  const { env, client, runSecret } = deps
  const missing = REQUIRED_ENV.filter((name) => !env[name])
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`)
  }

  if (env.GITHUB_ACTIONS && !env.GH_PAT) {
    throw new Error('GH_PAT is required to rotate STRAVA_REFRESH_TOKEN')
  }

  console.log('Refreshing Strava access token...')
  const tokens = await client.refreshToken({
    clientId: env.STRAVA_CLIENT_ID!,
    clientSecret: env.STRAVA_CLIENT_SECRET!,
    refreshToken: env.STRAVA_REFRESH_TOKEN!,
  })
  if (env.GITHUB_ACTIONS) console.log(`::add-mask::${tokens.accessToken}`)
  rotateRefreshTokenSecret(tokens.refreshToken, { env, run: runSecret })

  return syncPRs(tokens.accessToken, deps)
}
