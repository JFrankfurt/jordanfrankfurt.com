import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type StravaClient } from '../scripts/strava/client'
import { runSync } from '../scripts/strava/run'
import { rotateRefreshTokenSecret } from '../scripts/strava/secret'
import {
  afterTimestamp,
  fetchRunActivities,
  syncPRs,
  type PRsFile,
} from '../scripts/strava/sync'

const START = Date.parse('2026-06-02T06:00:00.000Z')
const DAY = 86_400_000

const basePRs: PRsFile = {
  '400m': 90,
  '5k': 1500,
  '10k': 3100,
  half: 7100,
  lastSyncedAt: '2026-06-01T06:00:00.000Z',
}

const effort = (name: string, moving_time: number) => ({
  name,
  distance: 0,
  moving_time,
  elapsed_time: moving_time,
  pr_rank: null,
})

function makeDeps(
  getJson: (
    path: string,
    token: string,
    params?: Record<string, string>
  ) => unknown,
  prs: PRsFile = basePRs
) {
  const writePRs = vi.fn()
  return {
    getJson: vi.fn(
      async (path: string, token: string, params?: Record<string, string>) =>
        getJson(path, token, params)
    ),
    writePRs,
    deps: (client: Pick<StravaClient, 'getJson'>) => ({
      client,
      now: () => START,
      readPRs: () => prs,
      writePRs,
    }),
  }
}

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('afterTimestamp', () => {
  it('is null for a full sync', () => {
    expect(afterTimestamp(null)).toBeNull()
  })

  it('looks back one day from the cursor, in seconds', () => {
    expect(afterTimestamp('2026-06-01T06:00:00.000Z')).toBe(
      String((Date.parse('2026-06-01T06:00:00.000Z') - DAY) / 1000)
    )
  })

  it('rejects an invalid cursor', () => {
    expect(() => afterTimestamp('nope')).toThrow('Invalid lastSyncedAt')
  })
})

describe('fetchRunActivities', () => {
  it('pages until a short page and keeps only runs', async () => {
    const page = (n: number, type: string) =>
      Array.from({ length: n }, (_, i) => ({
        id: i,
        type,
        start_date: '',
      }))
    const getJson = vi
      .fn()
      .mockResolvedValueOnce(page(200, 'Run'))
      .mockResolvedValueOnce([
        ...page(1, 'Ride'),
        { id: 9, type: 'Workout', sport_type: 'TrailRun', start_date: '' },
      ])
    const runs = await fetchRunActivities({ getJson }, 'tok', '123')
    expect(runs).toHaveLength(201)
    expect(getJson.mock.calls.map((c) => c[2])).toEqual([
      { per_page: '200', page: '1', after: '123' },
      { per_page: '200', page: '2', after: '123' },
    ])
  })

  it('stops at the page cap', async () => {
    const full = Array.from({ length: 200 }, (_, id) => ({
      id,
      type: 'Ride',
      start_date: '',
    }))
    const getJson = vi.fn().mockResolvedValue(full)
    await expect(fetchRunActivities({ getJson }, 'tok', null)).rejects.toThrow(
      'exceeded 50 pages'
    )
    expect(getJson).toHaveBeenCalledTimes(50)
  })
})

describe('syncPRs', () => {
  it('updates faster PRs and stores the run start time as the cursor', async () => {
    const t = makeDeps((path) =>
      path === '/athlete/activities'
        ? [{ id: 1, type: 'Run', start_date: '' }]
        : { best_efforts: [effort('5k', 1400), effort('10k', 3200)] }
    )
    let clock = START
    const result = await syncPRs('tok', {
      ...t.deps({ getJson: t.getJson as StravaClient['getJson'] }),
      now: () => {
        const value = clock
        clock += 10 * 60_000
        return value
      },
    })
    expect(result.changed).toBe(true)
    expect(t.writePRs).toHaveBeenCalledTimes(1)
    expect(t.writePRs).toHaveBeenCalledWith({
      '400m': 90,
      '5k': 1400,
      '10k': 3100,
      half: 7100,
      lastSyncedAt: new Date(START).toISOString(),
    })
    expect(clock).toBe(START + 10 * 60_000)
  })

  it('queries Strava with the lookback cursor', async () => {
    const t = makeDeps(() => [])
    await syncPRs(
      'tok',
      t.deps({ getJson: t.getJson as StravaClient['getJson'] })
    )
    expect(t.getJson.mock.calls[0][2]).toMatchObject({
      after: String((Date.parse(basePRs.lastSyncedAt!) - DAY) / 1000),
    })
  })

  it('writes the cursor even when nothing changed', async () => {
    const t = makeDeps((path) =>
      path === '/athlete/activities'
        ? [{ id: 1, type: 'Run', start_date: '' }]
        : { best_efforts: [effort('5k', 1600)] }
    )
    const result = await syncPRs(
      'tok',
      t.deps({ getJson: t.getJson as StravaClient['getJson'] })
    )
    expect(result.changed).toBe(false)
    expect(t.writePRs).toHaveBeenCalledWith({
      ...basePRs,
      lastSyncedAt: new Date(START).toISOString(),
    })
  })

  it('writes nothing when an activity fetch fails', async () => {
    const t = makeDeps((path) => {
      if (path === '/athlete/activities') {
        return [
          { id: 1, type: 'Run', start_date: '' },
          { id: 2, type: 'Run', start_date: '' },
        ]
      }
      if (path === '/activities/2') throw new Error('Strava API error 500')
      return { best_efforts: [effort('5k', 1400)] }
    })
    await expect(
      syncPRs('tok', t.deps({ getJson: t.getJson as StravaClient['getJson'] }))
    ).rejects.toThrow('Strava API error 500')
    expect(t.writePRs).not.toHaveBeenCalled()
  })

  it('writes nothing when the activity list fails', async () => {
    const t = makeDeps(() => {
      throw new Error('boom')
    })
    await expect(
      syncPRs('tok', t.deps({ getJson: t.getJson as StravaClient['getJson'] }))
    ).rejects.toThrow('boom')
    expect(t.writePRs).not.toHaveBeenCalled()
  })
})

describe('rotateRefreshTokenSecret', () => {
  it('skips outside GitHub Actions', () => {
    const run = vi.fn()
    rotateRefreshTokenSecret('new', { env: {}, run })
    expect(run).not.toHaveBeenCalled()
  })

  it('masks the token and runs gh with the PAT and token on stdin', () => {
    const run = vi.fn()
    rotateRefreshTokenSecret('new-token', {
      env: {
        GITHUB_ACTIONS: 'true',
        GH_PAT: 'pat',
        GITHUB_REPOSITORY: 'o/r',
        GH_TOKEN: 'other',
      },
      run,
    })
    expect(console.log).toHaveBeenCalledWith('::add-mask::new-token')
    expect(run).toHaveBeenCalledWith(
      'gh',
      ['secret', 'set', 'STRAVA_REFRESH_TOKEN', '--repo', 'o/r'],
      expect.objectContaining({
        input: 'new-token',
        env: expect.objectContaining({ GH_TOKEN: 'pat' }),
      })
    )
  })

  it('fails without logging the token when gh fails', () => {
    const run = vi.fn(() => {
      throw new Error('gh exploded with new-token')
    })
    expect(() =>
      rotateRefreshTokenSecret('new-token', {
        env: { GITHUB_ACTIONS: 'true', GH_PAT: 'pat' },
        run,
      })
    ).toThrow('Failed to rotate STRAVA_REFRESH_TOKEN secret')
    try {
      rotateRefreshTokenSecret('new-token', {
        env: { GITHUB_ACTIONS: 'true', GH_PAT: 'pat' },
        run,
      })
    } catch (error) {
      expect((error as Error).message).not.toContain('new-token')
    }
  })

  it('fails when GH_PAT is missing', () => {
    const run = vi.fn()
    expect(() =>
      rotateRefreshTokenSecret('new', { env: { GITHUB_ACTIONS: 'true' }, run })
    ).toThrow('GH_PAT is required')
    expect(run).not.toHaveBeenCalled()
  })
})

describe('runSync', () => {
  const env = {
    STRAVA_CLIENT_ID: 'id',
    STRAVA_CLIENT_SECRET: 'secret',
    STRAVA_REFRESH_TOKEN: 'old',
    GITHUB_ACTIONS: 'true',
    GH_PAT: 'pat',
  }

  function setup(overrides: Partial<StravaClient> = {}) {
    const client: StravaClient = {
      refreshToken: vi.fn(async () => ({
        accessToken: 'access',
        refreshToken: 'rotated',
      })),
      getJson: vi.fn(async () => []) as StravaClient['getJson'],
      ...overrides,
    }
    const writePRs = vi.fn()
    const runSecret = vi.fn()
    return {
      client,
      writePRs,
      runSecret,
      deps: {
        client,
        env,
        now: () => START,
        readPRs: () => basePRs,
        writePRs,
        runSecret,
      },
    }
  }

  it('rotates the secret before fetching and writes on success', async () => {
    const t = setup()
    await runSync(t.deps)
    expect(t.runSecret).toHaveBeenCalledWith(
      'gh',
      ['secret', 'set', 'STRAVA_REFRESH_TOKEN'],
      expect.objectContaining({ input: 'rotated' })
    )
    expect(t.runSecret.mock.invocationCallOrder[0]).toBeLessThan(
      (t.client.getJson as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]
    )
    expect(t.writePRs).toHaveBeenCalledTimes(1)
  })

  it('fails on missing env without calling Strava', async () => {
    const t = setup()
    await expect(
      runSync({ ...t.deps, env: { ...env, STRAVA_CLIENT_SECRET: '' } })
    ).rejects.toThrow('STRAVA_CLIENT_SECRET')
    expect(t.client.refreshToken).not.toHaveBeenCalled()
    expect(t.writePRs).not.toHaveBeenCalled()
  })

  it('does not write when token refresh fails', async () => {
    const t = setup({
      refreshToken: vi.fn(async () => {
        throw new Error('Token refresh failed: 400')
      }),
    })
    await expect(runSync(t.deps)).rejects.toThrow('Token refresh failed')
    expect(t.runSecret).not.toHaveBeenCalled()
    expect(t.writePRs).not.toHaveBeenCalled()
  })

  it('does not write when secret rotation fails', async () => {
    const t = setup()
    t.runSecret.mockImplementation(() => {
      throw new Error('no')
    })
    await expect(runSync(t.deps)).rejects.toThrow('Failed to rotate')
    expect(t.client.getJson).not.toHaveBeenCalled()
    expect(t.writePRs).not.toHaveBeenCalled()
  })

  it('does not write when the sync fails', async () => {
    const t = setup({
      getJson: vi.fn(async () => {
        throw new Error('Strava API error 429')
      }) as StravaClient['getJson'],
    })
    await expect(runSync(t.deps)).rejects.toThrow('429')
    expect(t.writePRs).not.toHaveBeenCalled()
  })
})
