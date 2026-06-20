import { describe, expect, it } from 'vitest'

import {
  DEFAULT_ECOSYSTEM_INPUTS,
  simulateEcosystem,
  type EcosystemInputs,
  type EcosystemSpeciesId,
} from './ecosystem'

type EcosystemInputOverrides = Omit<
  Partial<EcosystemInputs>,
  'activeSpecies'
> & {
  activeSpecies?: Partial<Record<EcosystemSpeciesId, boolean>>
}

function createInputs(
  overrides: EcosystemInputOverrides = {},
): EcosystemInputs {
  return {
    ...DEFAULT_ECOSYSTEM_INPUTS,
    ...overrides,
    activeSpecies: {
      ...DEFAULT_ECOSYSTEM_INPUTS.activeSpecies,
      ...overrides.activeSpecies,
    },
  }
}

describe('ecosystem simulation', () => {
  it('keeps a complete food web mostly stable under clean conditions', () => {
    const result = simulateEcosystem(DEFAULT_ECOSYSTEM_INPUTS)

    expect(result.history).toHaveLength(33)
    expect(result.stabilityScore).toBeGreaterThanOrEqual(65)
    expect(result.finalPopulations.plant).toBeGreaterThan(20)
    expect(result.energyFlows.length).toBeGreaterThan(4)
  })

  it('collapses consumers when the producer is removed', () => {
    const result = simulateEcosystem(
      createInputs({
        activeSpecies: {
          plant: false,
        },
      }),
    )

    expect(result.finalPopulations.plant).toBe(0)
    expect(result.finalPopulations.grasshopper).toBeLessThan(10)
    expect(result.finalPopulations.frog).toBeLessThan(8)
    expect(result.observationCodes).toContain('producerRemoved')
  })

  it('reduces prey populations when the top predator is boosted', () => {
    const baseline = simulateEcosystem(DEFAULT_ECOSYSTEM_INPUTS)
    const boosted = simulateEcosystem(
      createInputs({
        predatorBoost: 100,
      }),
    )

    expect(boosted.finalPopulations.rabbit).toBeLessThan(
      baseline.finalPopulations.rabbit,
    )
    expect(boosted.observationCodes).toContain('topPredatorPressure')
  })

  it('lowers ecosystem stability under heavy pollution', () => {
    const baseline = simulateEcosystem(DEFAULT_ECOSYSTEM_INPUTS)
    const polluted = simulateEcosystem(
      createInputs({
        pollution: 85,
      }),
    )

    expect(polluted.stabilityScore).toBeLessThan(baseline.stabilityScore)
    expect(polluted.finalPopulations.plant).toBeLessThan(
      baseline.finalPopulations.plant,
    )
    expect(polluted.observationCodes).toContain('pollutionStress')
  })
})
