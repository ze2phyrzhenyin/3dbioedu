import { describe, expect, it } from 'vitest'

import {
  calculateMetabolism,
  generateMetabolismDayCycle,
  type MetabolismInputs,
} from './metabolism'

const defaultInputs: MetabolismInputs = {
  period: 'day',
  lightIntensity: 75,
  carbonDioxide: 70,
  water: 75,
  temperature: 25,
  leafArea: 80,
}

describe('metabolism utility functions', () => {
  it('keeps respiration active at night while photosynthesis stops', () => {
    const rates = calculateMetabolism({
      ...defaultInputs,
      period: 'night',
    })

    expect(rates.photosynthesisRate).toBe(0)
    expect(rates.respirationRate).toBeGreaterThan(0)
    expect(rates.netOrganicMatter).toBeLessThan(0)
    expect(rates.limitingFactor).toBe('light')
  })

  it('accumulates organic matter when daytime conditions are strong', () => {
    const rates = calculateMetabolism({
      period: 'day',
      lightIntensity: 95,
      carbonDioxide: 95,
      water: 90,
      temperature: 28,
      leafArea: 100,
    })

    expect(rates.photosynthesisRate).toBeGreaterThan(rates.respirationRate)
    expect(rates.netOrganicMatter).toBeGreaterThan(35)
    expect(rates.oxygenBalance).toBeGreaterThan(0)
    expect(rates.carbonDioxideBalance).toBeLessThan(0)
  })

  it('identifies low light as the limiting factor in daytime', () => {
    const rates = calculateMetabolism({
      ...defaultInputs,
      lightIntensity: 5,
    })

    expect(rates.limitingFactor).toBe('light')
    expect(rates.photosynthesisRate).toBeLessThan(rates.respirationRate)
  })

  it('generates a day cycle with midday photosynthesis above midnight', () => {
    const series = generateMetabolismDayCycle(defaultInputs)
    const midnight = series.find((point) => point.hour === 0)
    const midday = series.find((point) => point.hour === 12)

    expect(series).toHaveLength(25)
    expect(midnight?.photosynthesisRate).toBe(0)
    expect(midday?.photosynthesisRate).toBeGreaterThan(
      midnight?.photosynthesisRate ?? 0,
    )
  })
})
