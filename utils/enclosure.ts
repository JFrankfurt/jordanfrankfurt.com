import fs from 'fs'
import { resolvePublicFile } from './blog'

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export interface EnclosureOptions {
  fetch?: FetchLike
  /** Total time allowed for all requests made for one URL. */
  timeoutMs?: number
  publicDirectory: string
  /** Files under this origin are read from `publicDirectory`, never fetched. */
  siteOrigin: string
}

export const DEFAULT_ENCLOSURE_TIMEOUT_MS = 10_000

const FALLBACK_STATUSES = new Set([405, 501])

function sizeFromHeaders(response: Response): number | null {
  const encoding = response.headers.get('content-encoding')
  if (encoding && encoding.trim().toLowerCase() !== 'identity') return null
  const length = response.headers.get('content-length')
  if (!length || !/^\d+$/.test(length.trim())) return null
  const size = Number(length)
  return Number.isSafeInteger(size) && size > 0 ? size : null
}

function sizeFromContentRange(response: Response): number | null {
  const encoding = response.headers.get('content-encoding')
  if (encoding && encoding.trim().toLowerCase() !== 'identity') return null
  const match = response.headers
    .get('content-range')
    ?.trim()
    .match(/^bytes \d+-\d+\/(\d+)$/i)
  if (!match) return null
  const size = Number(match[1])
  return Number.isSafeInteger(size) && size > 0 ? size : null
}

async function sizeFromHttp(
  url: URL,
  doFetch: FetchLike,
  signal: AbortSignal
): Promise<number> {
  const request = (method: string, extra: Record<string, string> = {}) =>
    doFetch(url.toString(), {
      method,
      redirect: 'follow',
      signal,
      headers: { 'accept-encoding': 'identity', ...extra },
    })

  const head = await request('HEAD')
  await head.body?.cancel()
  if (head.ok) {
    const size = sizeFromHeaders(head)
    if (size !== null) return size
  } else if (!FALLBACK_STATUSES.has(head.status)) {
    throw new Error(`HEAD returned HTTP ${head.status}`)
  }

  // Some servers ignore range requests. Cancel the body before reading the full file.
  const probe = await request('GET', { range: 'bytes=0-0' })
  await probe.body?.cancel()
  if (probe.status === 206) {
    const size = sizeFromContentRange(probe)
    if (size !== null) return size
    throw new Error('response has no usable Content-Range total')
  }
  if (probe.status === 200) {
    const size = sizeFromHeaders(probe)
    if (size !== null) return size
    throw new Error('response has no usable Content-Length')
  }
  throw new Error(`GET returned HTTP ${probe.status}`)
}

/** Returns the exact byte size of the file at `url`, or throws. */
export async function getEnclosureLength(
  url: URL,
  {
    fetch: doFetch = fetch,
    timeoutMs = DEFAULT_ENCLOSURE_TIMEOUT_MS,
    publicDirectory,
    siteOrigin,
  }: EnclosureOptions
): Promise<number> {
  try {
    if (url.origin === siteOrigin) {
      const filePath = resolvePublicFile(publicDirectory, url.pathname)
      const stats = filePath
        ? fs.statSync(filePath, { throwIfNoEntry: false })
        : undefined
      if (!stats?.isFile() || stats.size === 0) {
        throw new Error(`no non-empty file at public${url.pathname}`)
      }
      return stats.size
    }
    const signal = AbortSignal.timeout(timeoutMs)
    try {
      return await sizeFromHttp(url, doFetch, signal)
    } catch (error) {
      if (signal.aborted) throw new Error(`timed out after ${timeoutMs}ms`)
      throw error
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`cannot determine size of ${url}: ${reason}`, {
      cause: error,
    })
  }
}
