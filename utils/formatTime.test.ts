import { describe, expect, it } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('formats sub-hour times as M:SS', () => {
    expect(formatTime(342)).toBe('5:42')
    expect(formatTime(1188)).toBe('19:48')
    expect(formatTime(2531)).toBe('42:11')
    expect(formatTime(60)).toBe('1:00')
    expect(formatTime(0)).toBe('0:00')
  })

  it('formats hour+ times as H:MM:SS', () => {
    expect(formatTime(5634)).toBe('1:33:54')
    expect(formatTime(12068)).toBe('3:21:08')
    expect(formatTime(3600)).toBe('1:00:00')
    expect(formatTime(3661)).toBe('1:01:01')
  })

  it('zero-pads seconds and minutes', () => {
    expect(formatTime(5)).toBe('0:05')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(3605)).toBe('1:00:05')
  })
})
