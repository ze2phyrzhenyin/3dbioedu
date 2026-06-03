export const VALID_DNA_BASES = ['A', 'T', 'C', 'G'] as const

export type DnaBase = (typeof VALID_DNA_BASES)[number]
export type PairType = 'A-T' | 'C-G'

export interface ValidSequenceResult {
  isValid: true
  sequence: string
  invalidCharacters: []
}

export interface InvalidSequenceResult {
  isValid: false
  sequence: string
  invalidCharacters: string[]
  message: string
}

export type SequenceValidationResult =
  | ValidSequenceResult
  | InvalidSequenceResult

export interface BasePair {
  id: string
  index: number
  base: DnaBase
  complement: DnaBase
  pairType: PairType
  pairLabel: string
}

const COMPLEMENT_BY_BASE: Record<DnaBase, DnaBase> = {
  A: 'T',
  T: 'A',
  C: 'G',
  G: 'C',
}

export function normalizeDnaSequence(sequence: string): string {
  return sequence.replace(/\s+/g, '').toUpperCase()
}

export function isDnaBase(base: string): base is DnaBase {
  return VALID_DNA_BASES.includes(base as DnaBase)
}

export function validateDnaSequence(
  sequence: string,
): SequenceValidationResult {
  const normalizedSequence = normalizeDnaSequence(sequence)
  const invalidCharacters = Array.from(
    new Set(
      normalizedSequence
        .split('')
        .filter((character) => !isDnaBase(character)),
    ),
  )

  if (invalidCharacters.length > 0) {
    return {
      isValid: false,
      sequence: normalizedSequence,
      invalidCharacters,
      message: '只能输入 A、T、C、G / Saisir uniquement A, T, C ou G',
    }
  }

  return {
    isValid: true,
    sequence: normalizedSequence,
    invalidCharacters: [],
  }
}

export function getComplementBase(base: string): DnaBase {
  const normalizedBase = base.toUpperCase()

  if (!isDnaBase(normalizedBase)) {
    throw new Error(`Invalid DNA base: ${base}`)
  }

  return COMPLEMENT_BY_BASE[normalizedBase]
}

export function getComplementSequence(sequence: string): string {
  const validation = validateDnaSequence(sequence)

  if (!validation.isValid) {
    throw new Error('只能输入 A、T、C、G / Saisir uniquement A, T, C ou G')
  }

  return validation.sequence
    .split('')
    .map((base) => getComplementBase(base))
    .join('')
}

export function getPairType(base: DnaBase, complement: DnaBase): PairType {
  const pair = `${base}-${complement}`

  if (pair === 'A-T' || pair === 'T-A') {
    return 'A-T'
  }

  if (pair === 'C-G' || pair === 'G-C') {
    return 'C-G'
  }

  throw new Error(`Invalid DNA base pair: ${pair}`)
}

export function generateBasePairs(sequence: string): BasePair[] {
  const validation = validateDnaSequence(sequence)

  if (!validation.isValid) {
    throw new Error('只能输入 A、T、C、G / Saisir uniquement A, T, C ou G')
  }

  return validation.sequence.split('').map((baseCharacter, pairIndex) => {
    const base = baseCharacter as DnaBase
    const complement = getComplementBase(base)

    return {
      id: `base-pair-${pairIndex}`,
      index: pairIndex + 1,
      base,
      complement,
      pairType: getPairType(base, complement),
      pairLabel: `${base}-${complement}`,
    }
  })
}
