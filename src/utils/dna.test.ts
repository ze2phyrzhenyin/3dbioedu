import { describe, expect, it } from 'vitest'

import {
  generateBasePairs,
  getComplementBase,
  getComplementSequence,
  validateDnaSequence,
} from './dna'

describe('DNA utility functions', () => {
  it('returns correct complementary bases', () => {
    expect(getComplementBase('A')).toBe('T')
    expect(getComplementBase('T')).toBe('A')
    expect(getComplementBase('C')).toBe('G')
    expect(getComplementBase('G')).toBe('C')
  })

  it('generates a complementary sequence', () => {
    expect(getComplementSequence('ATCG')).toBe('TAGC')
  })

  it('marks invalid characters as invalid', () => {
    expect(validateDnaSequence('ATUG').isValid).toBe(false)
    expect(() => getComplementBase('U')).toThrow('Invalid DNA base')
  })

  it('generates only valid A-T and C-G base pairs', () => {
    expect(generateBasePairs('ATCG').map((pair) => pair.pairLabel)).toEqual([
      'A-T',
      'T-A',
      'C-G',
      'G-C',
    ])
  })
})
