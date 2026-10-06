export const STRAVA_API = 'https://www.strava.com/api/v3'

const RATE_WINDOW_MS = 15 * 60_000

export interface StravaClientOptions {
  fetch: typeof fetch
  sleep: (ms: number) => Promise<void>
  now: () => number
  secrets?: string[]
  requestTimeoutMs?: number
  maxRetries?: number
  maxTotalWaitMs?: number
  maxElapsedMs?: number
}

export interface StravaClient {
  getJson<T>(
    path: string,
    accessToken: string,
    params?: Record<string, string>
  ): Promise<T>
  refreshToken(credentials: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }): Promise<{ accessToken: string; refreshToken: string }>
}

export function redact(text: string, secrets: string[]): string {
  return secrets
    .filter((secret) => secret.length > 0)
    .sort((a, b) => b.length - a.length)
    .reduce((out, secret) => out.split(secret).join('[redacted]'), text)
}

// Strava sends no Retry-After; its short limit resets on 15 minute boundaries.
export function retryDelayMs(
  headers: Headers,
  nowMs: number,
  maxDelayMs: number
): number | null {
  const header = headers.get('Retry-After')
  let delay: number
  if (header !== null && header.trim() !== '') {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds >= 0) {
      delay = seconds * 1000
    } else {
      const date = Date.parse(header)
      if (Number.isNaN(date)) return null
      delay = Math.max(0, date - nowMs)
    }
  } else {
    delay = RATE_WINDOW_MS - (nowMs % RATE_WINDOW_MS) + 1000
  }
  return delay <= maxDelayMs ? delay : null
}

// A 429 caused by the daily limit cannot clear inside a job run.
function dailyLimitReached(headers: Headers): boolean {
  const usage = headers.get('X-RateLimit-Usage')?.split(',').map(Number)
  const limit = headers.get('X-RateLimit-Limit')?.split(',').map(Number)
  if (!usage || !limit || usage.length < 2 || limit.length < 2) return false
  return usage[1] >= limit[1]
}

export function createStravaClient(options: StravaClientOptions): StravaClient {
  const {
    sleep,
    now,
    secrets = [],
    requestTimeoutMs = 30_000,
    maxRetries = 3,
    maxTotalWaitMs = 40 * 60_000,
    maxElapsedMs = 45 * 60_000,
  } = options
  const doFetch = options.fetch
  let totalWaitMs = 0
  const deadline = now() + maxElapsedMs
  const protectedSecrets = new Set(secrets)
  const remainingTime = () => {
    const remaining = deadline - now()
    if (remaining <= 0)
      throw new Error('Strava sync exceeded its elapsed-time limit')
    return remaining
  }

  const describeError = (error: unknown) =>
    redact(error instanceof Error ? error.message : String(error), [
      ...protectedSecrets,
    ])

  async function readBody(res: Response): Promise<string> {
    try {
      return redact(await res.text(), [...protectedSecrets]).slice(0, 200)
    } catch {
      return ''
    }
  }

  async function send(url: string, init: RequestInit): Promise<Response> {
    return doFetch(url, {
      ...init,
      signal: AbortSignal.timeout(Math.min(requestTimeoutMs, remainingTime())),
    })
  }

  async function getJson<T>(
    path: string,
    accessToken: string,
    params?: Record<string, string>
  ): Promise<T> {
    protectedSecrets.add(accessToken)
    const url = new URL(`${STRAVA_API}${path}`)
    for (const [key, value] of Object.entries(params ?? {})) {
      url.searchParams.set(key, value)
    }

    for (let attempt = 0; ; attempt++) {
      remainingTime()
      let res: Response | undefined
      let failure = ''
      let delay: number | null = null

      try {
        res = await send(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      } catch (error) {
        failure = `request failed: ${describeError(error)}`
        delay = 5_000 * 2 ** attempt
      }

      if (res?.ok) {
        try {
          return (await res.json()) as T
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new Error(`Strava API returned invalid JSON on ${path}`)
          }
          failure = `request failed: ${describeError(error)}`
          delay = 5_000 * 2 ** attempt
          res = undefined
        }
      }

      if (res) {
        const body = await readBody(res)
        failure = `error ${res.status} on ${path}${body ? `: ${body}` : ''}`
        if (res.status === 429) {
          delay = dailyLimitReached(res.headers)
            ? null
            : retryDelayMs(res.headers, now(), maxTotalWaitMs)
        } else if (res.status >= 500) {
          delay = res.headers.get('Retry-After')?.trim()
            ? retryDelayMs(res.headers, now(), maxTotalWaitMs)
            : 5_000 * 2 ** attempt
        }
      }

      if (
        delay === null ||
        attempt >= maxRetries ||
        totalWaitMs + delay > maxTotalWaitMs
      ) {
        throw new Error(`Strava API ${failure}`)
      }

      if (delay >= remainingTime()) {
        throw new Error('Strava sync exceeded its elapsed-time limit')
      }
      totalWaitMs += delay
      console.log(
        `Strava API ${res ? `status ${res.status}` : 'network failure'} on ${path} — retry ${attempt + 1}/${maxRetries} in ${Math.ceil(delay / 1000)}s`
      )
      await sleep(delay)
    }
  }

  // No retries: a lost response could mean the refresh token already rotated.
  async function refreshToken(credentials: {
    clientId: string
    clientSecret: string
    refreshToken: string
  }) {
    protectedSecrets.add(credentials.clientSecret)
    protectedSecrets.add(credentials.refreshToken)
    let res: Response
    try {
      res = await send(`${STRAVA_API}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: credentials.refreshToken,
        }),
      })
    } catch (error) {
      throw new Error(`Token refresh failed: ${describeError(error)}`)
    }

    if (!res.ok) {
      throw new Error(`Token refresh failed: ${res.status}`)
    }

    let data: { access_token?: unknown; refresh_token?: unknown } | null
    try {
      data = await res.json()
    } catch {
      throw new Error('Token refresh returned invalid JSON')
    }
    if (
      !data ||
      typeof data.access_token !== 'string' ||
      typeof data.refresh_token !== 'string' ||
      !data.access_token ||
      !data.refresh_token
    ) {
      throw new Error('Token refresh response is missing tokens')
    }
    protectedSecrets.add(data.access_token)
    protectedSecrets.add(data.refresh_token)
    return { accessToken: data.access_token, refreshToken: data.refresh_token }
  }

  return { getJson, refreshToken }
}
