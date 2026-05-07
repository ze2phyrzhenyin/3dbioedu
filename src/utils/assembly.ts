import {
  type DnaBase,
  type PairType,
  getComplementBase,
  getPairType,
  isDnaBase,
  normalizeDnaSequence,
} from './dna'

export interface PlacementEvaluation {
  isValidBase: boolean
  isCorrectPair: boolean
  templateBase: DnaBase
  candidateBase: DnaBase | null
  expectedBase: DnaBase
  pairType: PairType
  hydrogenBondCount: number
}

const HYDROGEN_BOND_COUNT_BY_PAIR: Record<PairType, number> = {
  'A-T': 2,
  'C-G': 3,
}

export function evaluateBasePlacement(
  templateBase: DnaBase,
  candidateBase: string,
): PlacementEvaluation {
  const normalizedCandidate = candidateBase.toUpperCase()
  const expectedBase = getComplementBase(templateBase)
  const pairType = getPairType(templateBase, expectedBase)

  if (!isDnaBase(normalizedCandidate)) {
    return {
      isValidBase: false,
      isCorrectPair: false,
      templateBase,
      candidateBase: null,
      expectedBase,
      pairType,
      hydrogenBondCount: HYDROGEN_BOND_COUNT_BY_PAIR[pairType],
    }
  }

  return {
    isValidBase: true,
    isCorrectPair: normalizedCandidate === expectedBase,
    templateBase,
    candidateBase: normalizedCandidate,
    expectedBase,
    pairType,
    hydrogenBondCount: HYDROGEN_BOND_COUNT_BY_PAIR[pairType],
  }
}

export function getCompletedAssemblySequence(
  templateSequence: string,
  placedBases: Array<DnaBase | null>,
): string {
  return normalizeDnaSequence(templateSequence)
    .split('')
    .filter((baseCharacter, index) => {
      if (!isDnaBase(baseCharacter)) {
        return false
      }

      const placedBase = placedBases[index]

      return placedBase
        ? evaluateBasePlacement(baseCharacter, placedBase).isCorrectPair
        : false
    })
    .join('')
}

export function getAssemblyCompletion(
  templateSequence: string,
  placedBases: Array<DnaBase | null>,
) {
  const totalCount = normalizeDnaSequence(templateSequence).length
  const completedCount = getCompletedAssemblySequence(
    templateSequence,
    placedBases,
  ).length

  return {
    totalCount,
    completedCount,
    isComplete: totalCount > 0 && completedCount === totalCount,
    percentage: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
  }
}
