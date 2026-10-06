import path from 'node:path'
import { Settings } from 'luxon'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parsePost } from '../utils/blog'
import { getEnclosureLength } from '../utils/enclosure'
import {
  createStravaClient,
  type StravaClientOptions,
} from '../scripts/strava/client'
import { runSync } from '../scripts/strava/run'

const publicDirectory = path.resolve(
  import.meta.dirname,
  'fixtures/blog/public'
)
const json = (data: unknown) => new Response(JSON.stringify(data))

function clientWith(
  responses: Response[],
  extra: Partial<StravaClientOptions> = {}
) {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
    const response = responses.shift()
    if (!response) throw new Error('Unexpected request')
    return response
  })
  const sleep = vi.fn(async (_ms: number) => {})
  return {
    fetchMock,
    sleep,
    client: createStravaClient({
      fetch: fetchMock,
      sleep,
      now: () => 0,
      ...extra,
    }),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('content validation regressions', () => {
  it.each(['"12:34:56"', '"2024-02-30"', '2024-02-30'])(
    'rejects an incomplete or impossible calendar date: %s',
    async (date) => {
      await expect(
        parsePost(
          'posts/invalid.md',
          `---\ntitle: Invalid\ndate: ${date}\n---\nBody`,
          'invalid',
          publicDirectory
        )
      ).rejects.toThrow('front matter "date" must be an ISO 8601 date')
    }
  )

  it('normalizes a full calendar date independently of the current clock', async () => {
    const originalNow = Settings.now
    const source = '---\ntitle: Valid\ndate: 2024-02-29\n---\nBody'
    try {
      Settings.now = () => Date.UTC(2024, 0, 1)
      const first = await parsePost(
        'posts/valid.md',
        source,
        'valid',
        publicDirectory
      )
      Settings.now = () => Date.UTC(2025, 6, 1)
      const second = await parsePost(
        'posts/valid.md',
        source,
        'valid',
        publicDirectory
      )
      expect(first).toEqual(second)
      expect(first.attributes.date).toBe('2024-02-29T00:00:00.000Z')
    } finally {
      Settings.now = originalNow
    }
  })

  it('rejects compressed partial responses when probing audio size', async () => {
    const responses = [
      new Response(null, { status: 405 }),
      new Response(null, {
        status: 206,
        headers: {
          'Content-Encoding': 'gzip',
          'Content-Range': 'bytes 0-0/17',
        },
      }),
    ]
    await expect(
      getEnclosureLength(new URL('https://media.example/episode.mp3'), {
        publicDirectory,
        siteOrigin: 'https://example.com',
        fetch: async () => responses.shift()!,
      })
    ).rejects.toThrow('no usable Content-Range total')
  })
})

describe('Strava error and retry regressions', () => {
  it('redacts the complete secret before truncating an error body', async () => {
    const secret = 'boundary-secret-value'
    const { client } = clientWith(
      [new Response('x'.repeat(195) + secret, { status: 401 })],
      { secrets: [secret] }
    )
    const error = await client
      .getJson('/x', 'access-token')
      .catch((reason: Error) => reason)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).not.toContain(secret.slice(0, 5))
  })

  it('redacts the active access token from API error bodies', async () => {
    const accessToken = 'newly-issued-access-token'
    const { client } = clientWith([new Response(accessToken, { status: 401 })])
    await expect(client.getJson('/x', accessToken)).rejects.toThrow(
      '[redacted]'
    )
  })

  it('does not expose malformed token refresh response content', async () => {
    const { client, fetchMock } = clientWith([
      new Response('sensitive-refresh-response'),
    ])
    const error = await client
      .refreshToken({
        clientId: 'id',
        clientSecret: 'client-secret',
        refreshToken: 'old-refresh-token',
      })
      .catch((reason: Error) => reason)
    expect((error as Error).message).toBe('Token refresh returned invalid JSON')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('retries an aborted response body after receiving successful headers', async () => {
    const failedBody = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new DOMException('body aborted', 'AbortError'))
        },
      })
    )
    const { client, fetchMock, sleep } = clientWith([
      failedBody,
      json({ ok: true }),
    ])
    await expect(client.getJson('/x', 'access-token')).resolves.toEqual({
      ok: true,
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(5_000)
  })

  it('uses server-error backoff even near a rate-window boundary', async () => {
    const { client, sleep } = clientWith(
      [new Response(null, { status: 503 }), json({ ok: true })],
      { now: () => 14 * 60_000 + 30_000 }
    )
    await client.getJson('/x', 'access-token')
    expect(sleep).toHaveBeenCalledWith(5_000)
  })

  it('bounds elapsed time across successful requests', async () => {
    let clock = 0
    const { client, fetchMock } = clientWith([json({ ok: true })], {
      now: () => clock,
      maxElapsedMs: 100,
    })
    await client.getJson('/x', 'access-token')
    clock = 101
    await expect(client.getJson('/x', 'access-token')).rejects.toThrow(
      'elapsed-time limit'
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not start a retry that would exceed the elapsed-time deadline', async () => {
    const { client, sleep, fetchMock } = clientWith(
      [new Response(null, { status: 503 })],
      { maxElapsedMs: 4_000 }
    )
    await expect(client.getJson('/x', 'access-token')).rejects.toThrow(
      'elapsed-time limit'
    )
    expect(sleep).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('checks the Actions rotation prerequisite before refreshing any token', async () => {
    const refreshToken = vi.fn(async () => ({
      accessToken: 'access',
      refreshToken: 'refresh',
    }))
    const getJson = vi.fn(async <T,>() => [] as T)
    const writePRs = vi.fn()
    const runSecret = vi.fn()
    await expect(
      runSync({
        env: {
          GITHUB_ACTIONS: 'true',
          STRAVA_CLIENT_ID: 'id',
          STRAVA_CLIENT_SECRET: 'secret',
          STRAVA_REFRESH_TOKEN: 'refresh',
        },
        client: { refreshToken, getJson },
        now: () => 0,
        readPRs: () => ({
          '400m': null,
          '5k': null,
          '10k': null,
          half: null,
          lastSyncedAt: null,
        }),
        writePRs,
        runSecret,
      })
    ).rejects.toThrow('GH_PAT is required')
    expect(refreshToken).not.toHaveBeenCalled()
    expect(getJson).not.toHaveBeenCalled()
    expect(runSecret).not.toHaveBeenCalled()
    expect(writePRs).not.toHaveBeenCalled()
  })
})
