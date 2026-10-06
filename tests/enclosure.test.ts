import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { getEnclosureLength } from '../utils/enclosure'

const base = {
  publicDirectory: path.join(import.meta.dirname, 'fixtures/blog/public'),
  siteOrigin: 'https://site.test',
}
const url = new URL('https://cdn.test/a.m4a')
const initOf = (fetch: { mock: { calls: unknown[][] } }, call: number) =>
  fetch.mock.calls[call][1] as RequestInit
const noBody = (init: ResponseInit) => new Response(null, init)

describe('getEnclosureLength', () => {
  it('uses Content-Length from HEAD', async () => {
    const fetch = vi.fn(async () =>
      noBody({ headers: { 'content-length': '500' } })
    )
    expect(await getEnclosureLength(url, { ...base, fetch })).toBe(500)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('requests an identity encoding so the length is the file size', async () => {
    const fetch = vi.fn(async () =>
      noBody({ headers: { 'content-length': '5' } })
    )
    await getEnclosureLength(url, { ...base, fetch })
    expect(initOf(fetch, 0).headers).toMatchObject({
      'accept-encoding': 'identity',
    })
  })

  it.each([405, 501])(
    'falls back to a one-byte range request after HEAD %i',
    async (status) => {
      const fetch = vi.fn(async (_url: string, init: RequestInit) =>
        init.method === 'HEAD'
          ? noBody({ status })
          : noBody({
              status: 206,
              headers: { 'content-range': 'bytes 0-0/7000' },
            })
      )
      expect(await getEnclosureLength(url, { ...base, fetch })).toBe(7000)
      expect(initOf(fetch, 1).method).toBe('GET')
      expect(initOf(fetch, 1).headers).toMatchObject({
        range: 'bytes=0-0',
      })
    }
  )

  it('falls back when HEAD has no length and cancels the body of a full response', async () => {
    const cancel = vi.fn()
    const body = new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(8))
      },
      cancel,
    })
    const fetch = vi.fn(async (_url: string, init: RequestInit) =>
      init.method === 'HEAD'
        ? noBody({})
        : new Response(body, { headers: { 'content-length': '9000' } })
    )
    expect(await getEnclosureLength(url, { ...base, fetch })).toBe(9000)
    expect(cancel).toHaveBeenCalled()
  })

  it.each([
    ['unusable length', { 'content-length': 'abc' }],
    ['zero length', { 'content-length': '0' }],
    [
      'compressed length',
      { 'content-length': '10', 'content-encoding': 'gzip' },
    ],
    ['no length', {}],
  ])(
    'fails on %s when the fallback cannot help either',
    async (_name, headers) => {
      const fetch = vi.fn(async () => noBody({ headers }))
      await expect(getEnclosureLength(url, { ...base, fetch })).rejects.toThrow(
        /cannot determine size of https:\/\/cdn\.test\/a\.m4a: response has no usable Content-Length/
      )
    }
  )

  it('fails when the range response has no total', async () => {
    const fetch = vi.fn(async (_url: string, init: RequestInit) =>
      init.method === 'HEAD'
        ? noBody({ status: 405 })
        : noBody({ status: 206, headers: { 'content-range': 'bytes 0-0/*' } })
    )
    await expect(getEnclosureLength(url, { ...base, fetch })).rejects.toThrow(
      'no usable Content-Range'
    )
  })

  it.each([404, 500, 403])(
    'fails without a fallback on HEAD HTTP %i',
    async (status) => {
      const fetch = vi.fn(async () => noBody({ status }))
      await expect(getEnclosureLength(url, { ...base, fetch })).rejects.toThrow(
        `HEAD returned HTTP ${status}`
      )
      expect(fetch).toHaveBeenCalledTimes(1)
    }
  )

  it('fails on a non-success fallback response', async () => {
    const fetch = vi.fn(async (_url: string, init: RequestInit) =>
      noBody({ status: init.method === 'HEAD' ? 405 : 416 })
    )
    await expect(getEnclosureLength(url, { ...base, fetch })).rejects.toThrow(
      'GET returned HTTP 416'
    )
  })

  it('reports network errors', async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    await expect(getEnclosureLength(url, { ...base, fetch })).rejects.toThrow(
      'fetch failed'
    )
  })

  it('times out across the whole fallback sequence', async () => {
    const fetch = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method === 'HEAD') return noBody({ status: 405 })
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () =>
          reject(init.signal?.reason)
        )
      })
    })
    await expect(
      getEnclosureLength(url, { ...base, fetch, timeoutMs: 20 })
    ).rejects.toThrow('timed out after 20ms')
  })

  it('reads local files by stat and never fetches them', async () => {
    const fetch = vi.fn()
    const local = new URL('https://site.test/audio/local-episode.m4a')
    expect(await getEnclosureLength(local, { ...base, fetch })).toBe(1234)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not follow local paths out of the public directory or to directories', async () => {
    for (const p of [
      '/%2e%2e/posts/plain.md',
      '/audio',
      '/audio/missing.m4a',
    ]) {
      await expect(
        getEnclosureLength(new URL(p, 'https://site.test'), {
          ...base,
          fetch: vi.fn(),
        })
      ).rejects.toThrow('no non-empty file')
    }
  })
})
