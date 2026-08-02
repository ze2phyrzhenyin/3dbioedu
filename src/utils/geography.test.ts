import { describe, expect, it } from 'vitest'

import {
  DEFAULT_GEOGRAPHY_INPUTS,
  DEFAULT_LOCAL_WIND_INPUTS,
  calculateGlobalCirculation,
  calculateLocalWind,
} from './geography'

describe('geography circulation model', () => {
  it('moves pressure belts northward during the June solstice', () => {
    const equinox = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      season: 'marchEquinox',
    })
    const june = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      season: 'juneSolstice',
    })
    const equinoxLow = equinox.pressureBelts.find(
      (belt) => belt.type === 'equatorialLow',
    )
    const juneLow = june.pressureBelts.find(
      (belt) => belt.type === 'equatorialLow',
    )

    expect(june.solarDeclination).toBe(23.5)
    expect(juneLow?.centerLatitude).toBeGreaterThan(
      equinoxLow?.centerLatitude ?? 0,
    )
  })

  it('classifies equatorial low pressure as wet and subtropical high pressure as dry', () => {
    const equator = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      season: 'marchEquinox',
      selectedLatitude: 0,
    })
    const subtropical = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      season: 'marchEquinox',
      selectedLatitude: 30,
    })

    expect(equator.inspection.pressureBeltType).toBe('equatorialLow')
    expect(equator.inspection.precipitation).toBe('wet')
    expect(subtropical.inspection.pressureBeltType).toBe('subtropicalHigh')
    expect(subtropical.inspection.precipitation).toBe('dry')
  })

  it('uses opposite trade-wind deflection in the two hemispheres', () => {
    const circulation = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      season: 'marchEquinox',
      coriolisEnabled: true,
    })
    const northTrade = circulation.windBelts.find(
      (belt) => belt.id === 'north-trade',
    )
    const southTrade = circulation.windBelts.find(
      (belt) => belt.id === 'south-trade',
    )

    expect(northTrade?.directionDegrees).toBe(225)
    expect(southTrade?.directionDegrees).toBe(135)
  })

  it('forms weaker gyres when Coriolis is disabled', () => {
    const enabled = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      coriolisEnabled: true,
    })
    const disabled = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      coriolisEnabled: false,
    })

    expect(enabled.oceanCurrents[0].direction).toBe('clockwise')
    expect(disabled.oceanCurrents[0].direction).toBe('westward')
    expect(disabled.oceanCurrents[0].strength).toBeLessThan(
      enabled.oceanCurrents[0].strength,
    )
  })

  it('shows direct meridional flow when Coriolis is disabled', () => {
    const circulation = calculateGlobalCirculation({
      ...DEFAULT_GEOGRAPHY_INPUTS,
      season: 'marchEquinox',
      coriolisEnabled: false,
    })
    const northTrade = circulation.windBelts.find(
      (belt) => belt.id === 'north-trade',
    )
    const southTrade = circulation.windBelts.find(
      (belt) => belt.id === 'south-trade',
    )

    expect(northTrade?.directionDegrees).toBe(270)
    expect(southTrade?.directionDegrees).toBe(90)
  })

  it('turns upper-level wind parallel to isobars in opposite directions by hemisphere', () => {
    const north = calculateLocalWind({
      ...DEFAULT_LOCAL_WIND_INPUTS,
      hemisphere: 'north',
      level: 'upper',
      pressureLayout: 'highNorthLowSouth',
    })
    const south = calculateLocalWind({
      ...DEFAULT_LOCAL_WIND_INPUTS,
      hemisphere: 'south',
      level: 'upper',
      pressureLayout: 'highNorthLowSouth',
    })

    expect(north.finalWindDegrees).toBe(180)
    expect(south.finalWindDegrees).toBe(0)
    expect(north.isParallelToIsobars).toBe(true)
  })

  it('keeps surface wind crossing isobars toward lower pressure', () => {
    const surface = calculateLocalWind({
      ...DEFAULT_LOCAL_WIND_INPUTS,
      hemisphere: 'north',
      level: 'surface',
      pressureLayout: 'highNorthLowSouth',
      friction: 60,
    })

    expect(surface.finalWindDegrees).toBeGreaterThan(180)
    expect(surface.finalWindDegrees).toBeLessThan(270)
    expect(surface.crossIsobarAngle).toBeGreaterThan(20)
    expect(surface.isParallelToIsobars).toBe(false)
  })
})
