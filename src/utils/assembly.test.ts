import { describe, expect, it } from 'vitest'

import {
  evaluateBasePlacement,
  getAssemblyCompletion,
  getCompletedAssemblySequence,
} from './assembly'

describe('assembly utility functions', () => {
  it('accepts A-T with two hydrogen bonds', () => {
    expect(evaluateBasePlacement('A', 'T')).toMatchObject({
      isCorrectPair: true,
      pairType: 'A-T',
      hydrogenBondCount: 2,
    })
  })

  it('accepts C-G with three hydrogen bonds', () => {
    expect(evaluateBasePlacement('C', 'G')).toMatchObject({
      isCorrectPair: true,
      pairType: 'C-G',
      hydrogenBondCount: 3,
    })
  })

  it('rejects incorrect or non-DNA placement', () => {
    expect(evaluateBasePlacement('A', 'G')).toMatchObject({
      isValidBase: true,
      isCorrectPair: false,
      expectedBase: 'T',
    })
    expect(evaluateBasePlacement('A', 'U')).toMatchObject({
      isValidBase: false,
      isCorrectPair: false,
    })
  })

  it('returns only correctly assembled template positions', () => {
    expect(getCompletedAssemblySequence('ATCG', ['T', 'A', null, 'C'])).toBe(
      'ATG',
    )
    expect(getAssemblyCompletion('ATCG', ['T', 'A', null, 'C'])).toMatchObject(
      {
        totalCount: 4,
        completedCount: 3,
        isComplete: false,
        percentage: 75,
      },
    )
  })
})
