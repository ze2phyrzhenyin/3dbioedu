import type { BasePair, DnaBase } from './utils/dna'

export type StepId = 1 | 2 | 3 | 4
export type LearningMode = 'explore' | 'assemble'
export type Language = 'fr' | 'zh'

export interface DnaSelection {
  pair: BasePair
  base: DnaBase
}

export interface ViewOptions {
  showLabels: boolean
  highlightPairs: boolean
  showBackbone: boolean
  showHydrogenBonds: boolean
  splitOpen: boolean
}
