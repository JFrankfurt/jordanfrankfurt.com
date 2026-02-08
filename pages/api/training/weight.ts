import type { NextApiRequest, NextApiResponse } from 'next'
import { kvGet, kvPut, kvList, KV_KEYS } from 'utils/training/kv'

interface WeightEntry {
  date: string
  weightKg: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'POST') {
      const entry = req.body as WeightEntry
      if (!entry.date || entry.weightKg === undefined) {
        return res.status(400).json({ error: 'date and weightKg required' })
      }
      await kvPut(KV_KEYS.weightLog(entry.date), entry)
      return res.status(200).json({ success: true })
    }

    if (req.method === 'GET') {
      const { from, to } = req.query
      const { keys } = await kvList(KV_KEYS.weightPrefix)

      const entries: WeightEntry[] = []
      for (const key of keys) {
        const entry = await kvGet<WeightEntry>(key.name)
        if (entry) {
          if (from && entry.date < String(from)) continue
          if (to && entry.date > String(to)) continue
          entries.push(entry)
        }
      }

      entries.sort((a, b) => a.date.localeCompare(b.date))
      return res.status(200).json(entries)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
}
