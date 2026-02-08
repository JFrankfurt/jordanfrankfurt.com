import type { NextApiRequest, NextApiResponse } from 'next'
import { kvGet, kvPut, KV_KEYS } from 'utils/training/kv'
import { PlanConfig } from 'utils/training/types'
import {
  DEFAULT_CONSTRAINT_CONFIG,
  DEFAULT_NUTRITION_CONFIG,
  DEFAULT_PLAN_DURATION_WEEKS,
  DEFAULT_PROGRESSION_CONFIG,
  DEFAULT_RUN_COMMUTE,
} from 'utils/training/constants'

const DEFAULT_PLAN_CONFIG: PlanConfig = {
  startDate: new Date().toISOString().split('T')[0],
  durationWeeks: DEFAULT_PLAN_DURATION_WEEKS,
  fixedSessions: [],
  enabledModalities: [
    'bjj',
    'running',
    'lifting',
    'isometrics',
    'endRange',
    'recovery',
  ],
  runCommute: DEFAULT_RUN_COMMUTE,
  constraints: DEFAULT_CONSTRAINT_CONFIG,
  nutritionConfig: DEFAULT_NUTRITION_CONFIG,
  progressionConfig: DEFAULT_PROGRESSION_CONFIG,
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const settings = await kvGet<PlanConfig>(KV_KEYS.settings)
      if (!settings) {
        return res.status(200).json(DEFAULT_PLAN_CONFIG)
      }
      return res.status(200).json(settings)
    }

    if (req.method === 'PUT') {
      const config = req.body as PlanConfig
      await kvPut(KV_KEYS.settings, config)
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ error: String(error) })
  }
}
