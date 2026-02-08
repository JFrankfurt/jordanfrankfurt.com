import React, {
  createContext,
  useContext,
  useReducer,
  Dispatch,
  ReactNode,
} from 'react'
import {
  TrainingState,
  TrainingAction,
  TrainingPlan,
  PlanConfig,
  ReadinessLog,
} from 'utils/training/types'
import {
  DEFAULT_CONSTRAINT_CONFIG,
  DEFAULT_NUTRITION_CONFIG,
  DEFAULT_PROGRESSION_CONFIG,
  DEFAULT_RUN_COMMUTE,
  DEFAULT_PLAN_DURATION_WEEKS,
} from 'utils/training/constants'

// Default config for initial state
const defaultConfig: PlanConfig = {
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

// Initial state
const initialState: TrainingState = {
  plan: null,
  config: defaultConfig,
  readinessLogs: [],
  isGenerating: false,
  isLoading: false,
  error: null,
  selectedDate: null,
  activeView: 'calendar',
}

// Pure reducer
function trainingReducer(
  state: TrainingState,
  action: TrainingAction
): TrainingState {
  switch (action.type) {
    case 'LOAD_PLAN':
      return { ...state, plan: action.payload, isLoading: false }
    case 'GENERATE_PLAN_START':
      return { ...state, isGenerating: true, error: null }
    case 'GENERATE_PLAN_SUCCESS':
      return { ...state, plan: action.payload, isGenerating: false }
    case 'GENERATE_PLAN_ERROR':
      return { ...state, error: action.payload, isGenerating: false }
    case 'LOG_READINESS':
      return {
        ...state,
        readinessLogs: [
          ...state.readinessLogs.filter((l) => l.date !== action.payload.date),
          action.payload,
        ],
      }
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } }
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload }
    case 'SET_VIEW':
      return { ...state, activeView: action.payload }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'LOAD_READINESS_LOGS':
      return { ...state, readinessLogs: action.payload }
    case 'LOAD_CONFIG':
      return { ...state, config: action.payload }
    default:
      return state
  }
}

// Context
interface TrainingContextValue {
  state: TrainingState
  dispatch: Dispatch<TrainingAction>
}

const TrainingContext = createContext<TrainingContextValue | null>(null)

// Provider component
export function TrainingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(trainingReducer, initialState)
  return (
    <TrainingContext.Provider value={{ state, dispatch }}>
      {children}
    </TrainingContext.Provider>
  )
}

// Hook
export function useTraining(): TrainingContextValue {
  const context = useContext(TrainingContext)
  if (!context) {
    throw new Error('useTraining must be used within a TrainingProvider')
  }
  return context
}

// ========== Async helper functions (NOT in reducer) ==========

export async function loadSettings(
  dispatch: Dispatch<TrainingAction>
): Promise<void> {
  dispatch({ type: 'SET_LOADING', payload: true })
  try {
    const res = await fetch('/api/training/settings')
    const config = await res.json()
    dispatch({ type: 'LOAD_CONFIG', payload: config })
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: String(error) })
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false })
  }
}

export async function loadPlan(
  dispatch: Dispatch<TrainingAction>
): Promise<void> {
  dispatch({ type: 'SET_LOADING', payload: true })
  try {
    const res = await fetch('/api/training/plan')
    const data = await res.json()
    if (data.plan) {
      dispatch({ type: 'LOAD_PLAN', payload: data.plan })
    }
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: String(error) })
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false })
  }
}

export async function loadReadinessLogs(
  dispatch: Dispatch<TrainingAction>,
  from?: string,
  to?: string
): Promise<void> {
  try {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/api/training/readiness?${params}`)
    const logs = await res.json()
    dispatch({ type: 'LOAD_READINESS_LOGS', payload: logs })
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: String(error) })
  }
}

export async function savePlan(
  dispatch: Dispatch<TrainingAction>,
  config: PlanConfig
): Promise<void> {
  dispatch({ type: 'GENERATE_PLAN_START' })
  try {
    const res = await fetch('/api/training/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    const data = await res.json()
    if (data.error) {
      dispatch({ type: 'GENERATE_PLAN_ERROR', payload: data.error })
    } else {
      dispatch({ type: 'GENERATE_PLAN_SUCCESS', payload: data })
    }
  } catch (error) {
    dispatch({ type: 'GENERATE_PLAN_ERROR', payload: String(error) })
  }
}

export async function logReadiness(
  dispatch: Dispatch<TrainingAction>,
  log: ReadinessLog
): Promise<void> {
  try {
    await fetch('/api/training/readiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    })
    dispatch({ type: 'LOG_READINESS', payload: log })
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: String(error) })
  }
}

export async function saveSettings(
  dispatch: Dispatch<TrainingAction>,
  config: PlanConfig
): Promise<void> {
  try {
    await fetch('/api/training/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    dispatch({ type: 'UPDATE_CONFIG', payload: config })
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: String(error) })
  }
}
