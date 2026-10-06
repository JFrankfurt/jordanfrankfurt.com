import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStravaClient,
  redact,
  retryDelayMs,
} from '../scripts/strava/client'

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), init)

function setup(
  responses: Array<
    Response | Error | ((init: RequestInit) => Promise<Response>)
  >,
  extra: Partial<Parameters<typeof createStravaClient>[0]> = {}
) {
  const queue = [...responses]
  const fetchMock = vi.fn(
    async (_url: string | URL | Request, init?: RequestInit) => {
      const next = queue.shift()
      if (!next) throw new Error('unexpected fetch')
      if (next instanceof Error) throw next
      if (typeof next === 'function') return next(init ?? {})
      return next
    }
  )
  const sleep = vi.fn(async (_ms: number) => {})
  const client = createStravaClient({
    fetch: fetchMock as unknown as typeof fetch,
    sleep,
    now: () => 0,
    ...extra,
  })
  return { client, fetchMock, sleep }
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('retryDelayMs', () => {
  it('reads seconds from Retry-After', () => {
    expect(retryDelayMs(new Headers({ 'Retry-After': '12' }), 0, 60_000)).toBe(
      12_000
    )
  })

  it('reads an HTTP date from Retry-After', () => {
    const headers = new Headers({
      'Retry-After': new Date(30_000).toUTCString(),
    })
    expect(retryDelayMs(headers, 0, 60_000)).toBe(30_000)
  })

  it('waits for the next 15 minute boundary without Retry-After', () => {
    expect(retryDelayMs(new Headers(), 14 * 60_000, 20 * 60_000)).toBe(61_000)
  })

  it('returns null when the delay is above the cap', () => {
    expect(retryDelayMs(new Headers({ 'Retry-After': '999' }), 0, 60_000)).toBe(
      null
    )
  })

  it('returns null for an unreadable Retry-After', () => {
    expect(
      retryDelayMs(new Headers({ 'Retry-After': 'soon' }), 0, 60_000)
    ).toBe(null)
  })
})

describe('redact', () => {
  it('removes every secret occurrence and ignores empty secrets', () => {
    expect(redact('a s3cret b s3cret', ['s3cret', ''])).toBe(
      'a [redacted] b [redacted]'
    )
  })
})

describe('getJson', () => {
  it('sends the bearer token and query params', async () => {
    const { client, fetchMock } = setup([json({ ok: 1 })])
    await expect(
      client.getJson('/athlete/activities', 'tok', { page: '2' })
    ).resolves.toEqual({ ok: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(
      'https://www.strava.com/api/v3/athlete/activities?page=2'
    )
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer tok'
    )
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('honors Retry-After on 429 and then succeeds', async () => {
    const { client, sleep, fetchMock } = setup([
      new Response('slow down', {
        status: 429,
        headers: { 'Retry-After': '7' },
      }),
      json({ ok: 1 }),
    ])
    await expect(client.getJson('/x', 'tok')).resolves.toEqual({ ok: 1 })
    expect(sleep).toHaveBeenCalledWith(7_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('waits for the rate window when Strava sends no Retry-After', async () => {
    const { client, sleep } = setup(
      [new Response('', { status: 429 }), json({ ok: 1 })],
      { now: () => 5 * 60_000 }
    )
    await client.getJson('/x', 'tok')
    expect(sleep).toHaveBeenCalledWith(10 * 60_000 + 1000)
  })

  it('stops after the retry limit', async () => {
    const limited = () =>
      new Response('', { status: 429, headers: { 'Retry-After': '1' } })
    const { client, sleep, fetchMock } = setup(
      [limited(), limited(), limited()],
      { maxRetries: 2 }
    )
    await expect(client.getJson('/x', 'tok')).rejects.toThrow(
      'Strava API error 429 on /x'
    )
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
  })

  it('fails without waiting when Retry-After exceeds the wait budget', async () => {
    const { client, sleep } = setup(
      [new Response('', { status: 429, headers: { 'Retry-After': '3600' } })],
      { maxTotalWaitMs: 60_000 }
    )
    await expect(client.getJson('/x', 'tok')).rejects.toThrow('error 429')
    expect(sleep).not.toHaveBeenCalled()
  })

  it('shares the wait budget across requests', async () => {
    const limited = () =>
      new Response('', { status: 429, headers: { 'Retry-After': '40' } })
    const { client, sleep } = setup([limited(), json(1), limited()], {
      maxTotalWaitMs: 60_000,
    })
    await client.getJson('/a', 'tok')
    await expect(client.getJson('/b', 'tok')).rejects.toThrow('error 429')
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it('does not retry when the daily limit is used up', async () => {
    const { client, sleep, fetchMock } = setup([
      new Response('', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100,1000',
          'X-RateLimit-Usage': '10,1000',
        },
      }),
    ])
    await expect(client.getJson('/x', 'tok')).rejects.toThrow('error 429')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('retries server errors with backoff', async () => {
    const { client, sleep } = setup([
      new Response('', { status: 503 }),
      new Response('', { status: 502 }),
      json({ ok: 1 }),
    ])
    await expect(client.getJson('/x', 'tok')).resolves.toEqual({ ok: 1 })
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([5_000, 10_000])
  })

  it('does not retry other non-OK responses and truncates the body', async () => {
    const { client, sleep, fetchMock } = setup([
      new Response('x'.repeat(500), { status: 401 }),
    ])
    const error = await client.getJson('/x', 'tok').catch((e: Error) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(
      `Strava API error 401 on /x: ${'x'.repeat(200)}`
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('redacts secrets from error bodies', async () => {
    const { client } = setup(
      [new Response('bad token s3cret', { status: 400 })],
      { secrets: ['s3cret'] }
    )
    await expect(client.getJson('/x', 'active-access-token')).rejects.toThrow(
      'bad token [redacted]'
    )
  })

  it('retries network failures and then gives up', async () => {
    const { client, fetchMock } = setup(
      [new Error('socket hang up'), new Error('socket hang up')],
      { maxRetries: 1 }
    )
    await expect(client.getJson('/x', 'tok')).rejects.toThrow(
      'request failed: socket hang up'
    )
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('aborts a hung request at the timeout and retries it', async () => {
    const hang = (init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason)
        )
      })
    const { client, fetchMock } = setup([hang, json({ ok: 1 })], {
      requestTimeoutMs: 10,
    })
    await expect(client.getJson('/x', 'tok')).resolves.toEqual({ ok: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports invalid JSON', async () => {
    const { client } = setup([new Response('not json', { status: 200 })])
    await expect(client.getJson('/x', 'tok')).rejects.toThrow('invalid JSON')
  })
})

describe('refreshToken', () => {
  const credentials = {
    clientId: 'id',
    clientSecret: 'secret',
    refreshToken: 'old',
  }

  it('posts credentials and returns both tokens', async () => {
    const { client, fetchMock } = setup([
      json({ access_token: 'a', refresh_token: 'r', expires_at: 1 }),
    ])
    await expect(client.refreshToken(credentials)).resolves.toEqual({
      accessToken: 'a',
      refreshToken: 'r',
    })
    const init = fetchMock.mock.calls[0][1]
    expect(init?.method).toBe('POST')
    expect(String(init?.body)).toContain('refresh_token=old')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('does not retry and does not echo the response body', async () => {
    const { client, fetchMock, sleep } = setup([
      new Response('secret old', { status: 503 }),
    ])
    const error = await client.refreshToken(credentials).catch((e: Error) => e)
    expect((error as Error).message).toBe('Token refresh failed: 503')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('does not retry timeouts', async () => {
    const hang = (init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason)
        )
      })
    const { client, fetchMock } = setup([hang], { requestTimeoutMs: 10 })
    await expect(client.refreshToken(credentials)).rejects.toThrow(
      'Token refresh failed'
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a response without tokens', async () => {
    const { client } = setup([json({ access_token: 'a' })])
    await expect(client.refreshToken(credentials)).rejects.toThrow(
      'missing tokens'
    )
  })
})
