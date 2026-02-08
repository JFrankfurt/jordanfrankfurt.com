import type { NextApiRequest, NextApiResponse } from 'next'
import { kvGet, kvPut, KV_KEYS } from 'utils/training/kv'
import { TrainingPlan, PlanConfig } from 'utils/training/types'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const plan = await kvGet<TrainingPlan>(KV_KEYS.planLatest)
      return res.status(200).json({ plan })
    }

    if (req.method === 'POST') {
      const _config = req.body as PlanConfig
      void _config
      return res
        .status(501)
        .json({ error: 'Plan generation not yet implemented' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
}
