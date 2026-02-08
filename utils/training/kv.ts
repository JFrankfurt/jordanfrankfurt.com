// Server-side only guard
if (typeof window !== 'undefined') {
  throw new Error('KV client can only be used server-side')
}

// Environment variables (read at runtime)
const getEnv = () => ({
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  namespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID || '',
  apiToken: process.env.CLOUDFLARE_KV_API_TOKEN || '',
})

// KV Key schema
export const KV_KEYS = {
  settings: 'training:settings',
  plan: (id: string) => `training:plan:${id}`,
  planLatest: 'training:plan:latest',
  readinessLog: (date: string) => `training:readiness:${date}`,
  readinessPrefix: 'training:readiness:',
  weightLog: (date: string) => `training:weight:${date}`,
  weightPrefix: 'training:weight:',
}

// Error class
export class KVError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message)
    this.name = 'KVError'
  }
}

// Base URL builder
const getBaseUrl = () => {
  const { accountId, namespaceId } = getEnv()
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`
}

// Internal fetch wrapper
async function kvFetch(
  path: string,
  method: string,
  body?: unknown
): Promise<Response> {
  const { apiToken } = getEnv()

  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new KVError(
      `KV request failed: ${response.statusText}`,
      response.status
    )
  }

  return response
}

// GET value by key
export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const response = await kvFetch(`/values/${encodeURIComponent(key)}`, 'GET')
    const text = await response.text()
    if (!text) return null
    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof KVError && error.statusCode === 404) {
      return null
    }
    throw error
  }
}

// PUT value
export async function kvPut<T>(
  key: string,
  value: T,
  expirationTtl?: number
): Promise<void> {
  const url = expirationTtl
    ? `/values/${encodeURIComponent(key)}?expiration_ttl=${expirationTtl}`
    : `/values/${encodeURIComponent(key)}`

  await fetch(`${getBaseUrl()}${url}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getEnv().apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  })
}

// DELETE key
export async function kvDelete(key: string): Promise<void> {
  await kvFetch(`/values/${encodeURIComponent(key)}`, 'DELETE')
}

// LIST keys with prefix
export async function kvList(
  prefix?: string,
  limit: number = 1000,
  cursor?: string
): Promise<{ keys: { name: string }[]; cursor?: string }> {
  const params = new URLSearchParams()
  if (prefix) params.set('prefix', prefix)
  if (limit) params.set('limit', String(limit))
  if (cursor) params.set('cursor', cursor)

  const response = await kvFetch(`/keys?${params.toString()}`, 'GET')
  const data = (await response.json()) as {
    result?: { name: string }[]
    result_info?: { cursor?: string }
  }

  return {
    keys: data.result || [],
    cursor: data.result_info?.cursor,
  }
}
