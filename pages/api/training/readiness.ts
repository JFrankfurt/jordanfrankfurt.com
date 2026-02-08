import type { NextApiRequest, NextApiResponse } from 'next'
import { kvGet, kvPut, kvList, KV_KEYS } from 'utils/training/kv'
import { ReadinessLog } from 'utils/training/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'POST') {
      const log = req.body as ReadinessLog
      if (!log.date || !log.zone) {
        return res.status(400).json({ error: 'date and zone required' })
      }
      await kvPut(KV_KEYS.readinessLog(log.date), log)
      return res.status(200).json({ success: true })
    }

    if (req.method === 'GET') {
      const { from, to } = req.query
      // List all readiness keys
      const { keys } = await kvList(KV_KEYS.readinessPrefix)

      // Fetch all values
      const logs: ReadinessLog[] = []
      for (const key of keys) {
        const log = await kvGet<ReadinessLog>(key.name)
        if (log) {
          // Filter by date range if provided
          if (from && log.date < String(from)) continue
          if (to && log.date > String(to)) continue
          logs.push(log)
        }
      }

      // Sort by date
      logs.sort((a, b) => a.date.localeCompare(b.date))
      return res.status(200).json(logs)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
}
