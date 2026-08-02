export type GeographySeason =
  | 'marchEquinox'
  | 'juneSolstice'
  | 'septemberEquinox'
  | 'decemberSolstice'
export type Hemisphere = 'north' | 'south'
export type PressureBeltType =
  | 'equatorialLow'
  | 'subtropicalHigh'
  | 'subpolarLow'
  | 'polarHigh'
export type WindBeltType = 'trade' | 'westerly' | 'polarEasterly' | 'calm'
export type AirMotion = 'rising' | 'sinking' | 'converging' | 'diverging'
export type PrecipitationTendency = 'wet' | 'dry' | 'seasonal' | 'coldDry'
export type ClimateHint =
  | 'rainforest'
  | 'savanna'
  | 'desert'
  | 'mediterranean'
  | 'temperateMarine'
  | 'subpolar'
  | 'polar'
export type LocalWindLevel = 'surface' | 'upper'
export type PressureLayout =
  | 'highNorthLowSouth'
  | 'lowNorthHighSouth'
  | 'highWestLowEast'
  | 'lowWestHighEast'

export interface PressureBelt {
  id: string
  type: PressureBeltType
  centerLatitude: number
  width: number
  airMotion: AirMotion
}

export interface WindBelt {
  id: string
  type: WindBeltType
  hemisphere: Hemisphere
  fromLatitude: number
  toLatitude: number
  directionDegrees: number
  speed: number
}

export interface OceanCurrent {
  id: string
  basin: 'pacific' | 'atlantic' | 'indian' | 'southern'
  hemisphere: Hemisphere | 'global'
  name: string
  temperature: 'warm' | 'cold' | 'mixed'
  direction: 'clockwise' | 'counterclockwise' | 'eastward' | 'westward'
  strength: number
}

export interface GeographyInputs {
  season: GeographySeason
  coriolisEnabled: boolean
  thermalContrast: number
  selectedLatitude: number
}

export interface LatitudeInspection {
  latitude: number
  pressureBeltType: PressureBeltType
  windBeltType: WindBeltType
  hemisphere: Hemisphere | 'equator'
  airMotion: AirMotion
  precipitation: PrecipitationTendency
  climateHint: ClimateHint
  windDirectionDegrees: number
  windSpeed: number
}

export interface GlobalCirculationResult {
  solarDeclination: number
  seasonalShift: number
  pressureBelts: PressureBelt[]
  windBelts: WindBelt[]
  oceanCurrents: OceanCurrent[]
  inspection: LatitudeInspection
}

export interface LocalWindInputs {
  hemisphere: Hemisphere
  level: LocalWindLevel
  pressureGradient: number
  friction: number
  pressureLayout: PressureLayout
}

export interface LocalWindResult {
  pressureGradientForceDegrees: number
  coriolisDeflection: 'right' | 'left'
  finalWindDegrees: number
  geostrophicWindDegrees: number
  crossIsobarAngle: number
  speed: number
  isParallelToIsobars: boolean
}

export const DEFAULT_GEOGRAPHY_INPUTS: GeographyInputs = {
  season: 'juneSolstice',
  coriolisEnabled: true,
  thermalContrast: 70,
  selectedLatitude: 30,
}

export const DEFAULT_LOCAL_WIND_INPUTS: LocalWindInputs = {
  hemisphere: 'north',
  level: 'surface',
  pressureGradient: 68,
  friction: 42,
  pressureLayout: 'highNorthLowSouth',
}

const SOLAR_DECLINATION_BY_SEASON: Record<GeographySeason, number> = {
  marchEquinox: 0,
  juneSolstice: 23.5,
  septemberEquinox: 0,
  decemberSolstice: -23.5,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10
}

function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360
}

function shortestAngleDelta(fromDegrees: number, toDegrees: number) {
  return ((((toDegrees - fromDegrees + 180) % 360) + 360) % 360) - 180
}

function interpolateAngle(fromDegrees: number, toDegrees: number, ratio: number) {
  return normalizeDegrees(
    fromDegrees + shortestAngleDelta(fromDegrees, toDegrees) * ratio,
  )
}

function getSeasonalShift(season: GeographySeason) {
  return SOLAR_DECLINATION_BY_SEASON[season] * 0.35
}

function getHemisphere(latitude: number): Hemisphere | 'equator' {
  if (latitude > 1) {
    return 'north'
  }

  if (latitude < -1) {
    return 'south'
  }

  return 'equator'
}

function getAirMotion(type: PressureBeltType): AirMotion {
  if (type === 'equatorialLow' || type === 'subpolarLow') {
    return 'rising'
  }

  return 'sinking'
}

function createPressureBelts(seasonalShift: number): PressureBelt[] {
  const shiftedLatitude = (latitude: number) => clamp(latitude + seasonalShift, -88, 88)

  return [
    {
      id: 'polar-high-south',
      type: 'polarHigh',
      centerLatitude: -86,
      width: 10,
      airMotion: 'sinking',
    },
    {
      id: 'subpolar-low-south',
      type: 'subpolarLow',
      centerLatitude: shiftedLatitude(-60),
      width: 9,
      airMotion: 'rising',
    },
    {
      id: 'subtropical-high-south',
      type: 'subtropicalHigh',
      centerLatitude: shiftedLatitude(-30),
      width: 10,
      airMotion: 'sinking',
    },
    {
      id: 'equatorial-low',
      type: 'equatorialLow',
      centerLatitude: shiftedLatitude(0),
      width: 12,
      airMotion: 'rising',
    },
    {
      id: 'subtropical-high-north',
      type: 'subtropicalHigh',
      centerLatitude: shiftedLatitude(30),
      width: 10,
      airMotion: 'sinking',
    },
    {
      id: 'subpolar-low-north',
      type: 'subpolarLow',
      centerLatitude: shiftedLatitude(60),
      width: 9,
      airMotion: 'rising',
    },
    {
      id: 'polar-high-north',
      type: 'polarHigh',
      centerLatitude: 86,
      width: 10,
      airMotion: 'sinking',
    },
  ]
}

function getWindDirection(
  type: WindBeltType,
  hemisphere: Hemisphere,
  coriolisEnabled: boolean,
) {
  if (!coriolisEnabled) {
    if (type === 'trade') {
      return hemisphere === 'north' ? 270 : 90
    }

    if (type === 'westerly') {
      return hemisphere === 'north' ? 90 : 270
    }

    if (type === 'polarEasterly') {
      return hemisphere === 'north' ? 270 : 90
    }
  }

  if (type === 'trade') {
    return hemisphere === 'north' ? 225 : 135
  }

  if (type === 'westerly') {
    return hemisphere === 'north' ? 45 : 315
  }

  return hemisphere === 'north' ? 225 : 135
}

function createWindBelts(
  seasonalShift: number,
  coriolisEnabled: boolean,
  thermalContrast: number,
): WindBelt[] {
  const strength = 35 + clamp(thermalContrast, 0, 100) * 0.65
  const shiftedLatitude = (latitude: number) => clamp(latitude + seasonalShift, -88, 88)
  const windBelts: WindBelt[] = [
    {
      id: 'south-polar-easterly',
      type: 'polarEasterly',
      hemisphere: 'south',
      fromLatitude: -88,
      toLatitude: shiftedLatitude(-60),
      directionDegrees: getWindDirection('polarEasterly', 'south', coriolisEnabled),
      speed: strength * 0.62,
    },
    {
      id: 'south-westerly',
      type: 'westerly',
      hemisphere: 'south',
      fromLatitude: shiftedLatitude(-60),
      toLatitude: shiftedLatitude(-30),
      directionDegrees: getWindDirection('westerly', 'south', coriolisEnabled),
      speed: strength * 0.9,
    },
    {
      id: 'south-trade',
      type: 'trade',
      hemisphere: 'south',
      fromLatitude: shiftedLatitude(-30),
      toLatitude: shiftedLatitude(0),
      directionDegrees: getWindDirection('trade', 'south', coriolisEnabled),
      speed: strength * 0.78,
    },
    {
      id: 'north-trade',
      type: 'trade',
      hemisphere: 'north',
      fromLatitude: shiftedLatitude(0),
      toLatitude: shiftedLatitude(30),
      directionDegrees: getWindDirection('trade', 'north', coriolisEnabled),
      speed: strength * 0.78,
    },
    {
      id: 'north-westerly',
      type: 'westerly',
      hemisphere: 'north',
      fromLatitude: shiftedLatitude(30),
      toLatitude: shiftedLatitude(60),
      directionDegrees: getWindDirection('westerly', 'north', coriolisEnabled),
      speed: strength * 0.9,
    },
    {
      id: 'north-polar-easterly',
      type: 'polarEasterly',
      hemisphere: 'north',
      fromLatitude: shiftedLatitude(60),
      toLatitude: 88,
      directionDegrees: getWindDirection('polarEasterly', 'north', coriolisEnabled),
      speed: strength * 0.62,
    },
  ]

  return windBelts.map((belt) => ({
    ...belt,
    fromLatitude: roundOne(Math.min(belt.fromLatitude, belt.toLatitude)),
    toLatitude: roundOne(Math.max(belt.fromLatitude, belt.toLatitude)),
    speed: roundOne(belt.speed),
  }))
}

function createOceanCurrents(
  coriolisEnabled: boolean,
  thermalContrast: number,
): OceanCurrent[] {
  const baseStrength = coriolisEnabled ? 42 + clamp(thermalContrast, 0, 100) * 0.5 : 18

  return [
    {
      id: 'north-pacific-gyre',
      basin: 'pacific',
      hemisphere: 'north',
      name: 'North Pacific subtropical gyre',
      temperature: 'mixed',
      direction: coriolisEnabled ? 'clockwise' : 'westward',
      strength: roundOne(baseStrength),
    },
    {
      id: 'north-atlantic-gyre',
      basin: 'atlantic',
      hemisphere: 'north',
      name: 'North Atlantic subtropical gyre',
      temperature: 'mixed',
      direction: coriolisEnabled ? 'clockwise' : 'westward',
      strength: roundOne(baseStrength * 0.92),
    },
    {
      id: 'south-pacific-gyre',
      basin: 'pacific',
      hemisphere: 'south',
      name: 'South Pacific subtropical gyre',
      temperature: 'mixed',
      direction: coriolisEnabled ? 'counterclockwise' : 'westward',
      strength: roundOne(baseStrength * 0.9),
    },
    {
      id: 'south-atlantic-gyre',
      basin: 'atlantic',
      hemisphere: 'south',
      name: 'South Atlantic subtropical gyre',
      temperature: 'mixed',
      direction: coriolisEnabled ? 'counterclockwise' : 'westward',
      strength: roundOne(baseStrength * 0.82),
    },
    {
      id: 'equatorial-current',
      basin: 'pacific',
      hemisphere: 'global',
      name: 'Equatorial current',
      temperature: 'warm',
      direction: 'westward',
      strength: roundOne(baseStrength * 0.78),
    },
    {
      id: 'west-wind-drift',
      basin: 'southern',
      hemisphere: 'south',
      name: 'West Wind Drift',
      temperature: 'cold',
      direction: 'eastward',
      strength: roundOne(baseStrength * 1.08),
    },
  ]
}

function findNearestPressureBelt(
  pressureBelts: PressureBelt[],
  latitude: number,
): PressureBelt {
  return pressureBelts
    .slice()
    .sort(
      (left, right) =>
        Math.abs(left.centerLatitude - latitude) -
        Math.abs(right.centerLatitude - latitude),
    )[0]
}

function findWindBelt(
  windBelts: WindBelt[],
  latitude: number,
): WindBelt | null {
  return (
    windBelts.find(
      (belt) => latitude >= belt.fromLatitude && latitude <= belt.toLatitude,
    ) ?? null
  )
}

function getPrecipitation(
  pressureBeltType: PressureBeltType,
  latitude: number,
): PrecipitationTendency {
  if (pressureBeltType === 'equatorialLow' || pressureBeltType === 'subpolarLow') {
    return 'wet'
  }

  if (pressureBeltType === 'polarHigh' || Math.abs(latitude) > 72) {
    return 'coldDry'
  }

  if (Math.abs(latitude) >= 25 && Math.abs(latitude) <= 42) {
    return 'dry'
  }

  return 'seasonal'
}

function getClimateHint(
  pressureBeltType: PressureBeltType,
  precipitation: PrecipitationTendency,
  latitude: number,
): ClimateHint {
  const absoluteLatitude = Math.abs(latitude)

  if (absoluteLatitude > 72) {
    return 'polar'
  }

  if (pressureBeltType === 'subpolarLow') {
    return 'subpolar'
  }

  if (absoluteLatitude <= 10 && precipitation === 'wet') {
    return 'rainforest'
  }

  if (absoluteLatitude <= 23.5) {
    return 'savanna'
  }

  if (pressureBeltType === 'subtropicalHigh') {
    return 'desert'
  }

  if (absoluteLatitude >= 30 && absoluteLatitude <= 45) {
    return 'mediterranean'
  }

  return 'temperateMarine'
}

function inspectLatitude(
  latitude: number,
  pressureBelts: PressureBelt[],
  windBelts: WindBelt[],
): LatitudeInspection {
  const clampedLatitude = clamp(latitude, -89, 89)
  const pressureBelt = findNearestPressureBelt(pressureBelts, clampedLatitude)
  const windBelt = findWindBelt(windBelts, clampedLatitude)
  const precipitation = getPrecipitation(pressureBelt.type, clampedLatitude)

  return {
    latitude: roundOne(clampedLatitude),
    pressureBeltType: pressureBelt.type,
    windBeltType: windBelt?.type ?? 'calm',
    hemisphere: getHemisphere(clampedLatitude),
    airMotion: getAirMotion(pressureBelt.type),
    precipitation,
    climateHint: getClimateHint(pressureBelt.type, precipitation, clampedLatitude),
    windDirectionDegrees: windBelt?.directionDegrees ?? 0,
    windSpeed: windBelt?.speed ?? 0,
  }
}

export function calculateGlobalCirculation(
  inputs: GeographyInputs,
): GlobalCirculationResult {
  const solarDeclination = SOLAR_DECLINATION_BY_SEASON[inputs.season]
  const seasonalShift = getSeasonalShift(inputs.season)
  const pressureBelts = createPressureBelts(seasonalShift)
  const windBelts = createWindBelts(
    seasonalShift,
    inputs.coriolisEnabled,
    inputs.thermalContrast,
  )

  return {
    solarDeclination,
    seasonalShift: roundOne(seasonalShift),
    pressureBelts,
    windBelts,
    oceanCurrents: createOceanCurrents(
      inputs.coriolisEnabled,
      inputs.thermalContrast,
    ),
    inspection: inspectLatitude(
      inputs.selectedLatitude,
      pressureBelts,
      windBelts,
    ),
  }
}

function getPressureGradientForceDegrees(layout: PressureLayout) {
  if (layout === 'highNorthLowSouth') {
    return 270
  }

  if (layout === 'lowNorthHighSouth') {
    return 90
  }

  if (layout === 'highWestLowEast') {
    return 0
  }

  return 180
}

function getGeostrophicWindDegrees(
  pressureGradientForceDegrees: number,
  hemisphere: Hemisphere,
) {
  return normalizeDegrees(
    pressureGradientForceDegrees + (hemisphere === 'north' ? -90 : 90),
  )
}

export function calculateLocalWind(
  inputs: LocalWindInputs,
): LocalWindResult {
  const pressureGradientForceDegrees = getPressureGradientForceDegrees(
    inputs.pressureLayout,
  )
  const geostrophicWindDegrees = getGeostrophicWindDegrees(
    pressureGradientForceDegrees,
    inputs.hemisphere,
  )
  const friction = clamp(inputs.friction, 0, 100)
  const pressureGradient = clamp(inputs.pressureGradient, 0, 100)
  const deflectionRatio =
    inputs.level === 'upper' ? 1 : 0.32 + (100 - friction) * 0.0036
  const finalWindDegrees = interpolateAngle(
    pressureGradientForceDegrees,
    geostrophicWindDegrees,
    deflectionRatio,
  )
  const crossIsobarAngle =
    inputs.level === 'upper'
      ? 0
      : Math.round(Math.abs(shortestAngleDelta(finalWindDegrees, geostrophicWindDegrees)))
  const frictionSpeedFactor =
    inputs.level === 'upper' ? 1 : 0.55 + (100 - friction) * 0.003
  const speed = roundOne(pressureGradient * frictionSpeedFactor)

  return {
    pressureGradientForceDegrees,
    coriolisDeflection: inputs.hemisphere === 'north' ? 'right' : 'left',
    finalWindDegrees: roundOne(finalWindDegrees),
    geostrophicWindDegrees,
    crossIsobarAngle,
    speed,
    isParallelToIsobars: inputs.level === 'upper',
  }
}
