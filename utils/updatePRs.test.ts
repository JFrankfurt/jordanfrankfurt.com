import { describe, expect, it } from 'vitest'
import { updatePRs, type BestEffort } from './updatePRs'

const emptyPRs = () => ({
  mile: null as number | null,
  '5k': null as number | null,
  '10k': null as number | null,
  half: null as number | null,
  full: null as number | null,
})

function effort(name: string, moving_time: number): BestEffort {
  return {
    name,
    distance: 0,
    moving_time,
    elapsed_time: moving_time,
    pr_rank: null,
  }
}

describe('updatePRs', () => {
  it('sets first PR when current is null', () => {
    const { prs, changed } = updatePRs(emptyPRs(), [effort('1 mile', 342)])
    expect(prs.mile).toBe(342)
    expect(changed).toBe(true)
  })

  it('updates PR when new time is faster', () => {
    const current = { ...emptyPRs(), mile: 400 }
    const { prs, changed } = updatePRs(current, [effort('1 mile', 342)])
    expect(prs.mile).toBe(342)
    expect(changed).toBe(true)
  })

  it('keeps existing PR when new time is slower', () => {
    const current = { ...emptyPRs(), mile: 300 }
    const { prs, changed } = updatePRs(current, [effort('1 mile', 342)])
    expect(prs.mile).toBe(300)
    expect(changed).toBe(false)
  })

  it('keeps existing PR when new time is equal', () => {
    const current = { ...emptyPRs(), mile: 342 }
    const { prs, changed } = updatePRs(current, [effort('1 mile', 342)])
    expect(prs.mile).toBe(342)
    expect(changed).toBe(false)
  })

  it('ignores unknown distance names', () => {
    const { prs, changed } = updatePRs(emptyPRs(), [effort('400m', 55)])
    expect(changed).toBe(false)
    expect(prs).toEqual(emptyPRs())
  })

  it('handles all five Strava distance names', () => {
    const efforts = [
      effort('1 mile', 300),
      effort('5k', 1100),
      effort('10k', 2300),
      effort('Half-Marathon', 5200),
      effort('Marathon', 10700),
    ]
    const { prs, changed } = updatePRs(emptyPRs(), efforts)
    expect(changed).toBe(true)
    expect(prs.mile).toBe(300)
    expect(prs['5k']).toBe(1100)
    expect(prs['10k']).toBe(2300)
    expect(prs.half).toBe(5200)
    expect(prs.full).toBe(10700)
  })

  it('handles mixed updates — some faster, some slower', () => {
    const current = { ...emptyPRs(), mile: 300, '5k': 1200 }
    const efforts = [effort('1 mile', 350), effort('5k', 1100)]
    const { prs, changed } = updatePRs(current, efforts)
    expect(prs.mile).toBe(300)
    expect(prs['5k']).toBe(1100)
    expect(changed).toBe(true)
  })

  it('returns unchanged when best efforts is empty', () => {
    const current = { ...emptyPRs(), mile: 300 }
    const { prs, changed } = updatePRs(current, [])
    expect(prs.mile).toBe(300)
    expect(changed).toBe(false)
  })

  it('does not mutate the input object', () => {
    const current = { ...emptyPRs(), mile: 400 }
    const snapshot = { ...current }
    updatePRs(current, [effort('1 mile', 300)])
    expect(current).toEqual(snapshot)
  })
})
