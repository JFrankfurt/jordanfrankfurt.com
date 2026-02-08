import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const format = req.query.format as string | undefined

    if (format !== 'ics' && format !== 'json') {
      return res.status(400).json({ error: 'Format must be "ics" or "json"' })
    }

    return res.status(501).json({ error: 'Export not yet implemented' })
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
}
