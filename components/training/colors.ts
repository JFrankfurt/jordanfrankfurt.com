import { Modality } from 'utils/training/types'

export interface ModalityColors {
  bg: string
  bgLight: string
  text: string
  border: string
}

export const MODALITY_COLORS: Record<Modality, ModalityColors> = {
  bjj: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-300',
  },
  running: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-300',
  },
  lifting: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-300',
  },
  isometrics: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-300',
  },
  endRange: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-300',
  },
  recovery: {
    bg: 'bg-gray-400',
    bgLight: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-300',
  },
}

export const READINESS_COLORS = {
  green: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-400',
  },
  yellow: {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-400',
  },
  red: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-400',
  },
}
