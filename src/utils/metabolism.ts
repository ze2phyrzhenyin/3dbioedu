export type MetabolismPeriod = 'day' | 'night'
export type LimitingFactor =
  | 'light'
  | 'carbonDioxide'
  | 'water'
  | 'temperature'
  | 'leafArea'
  | 'none'
export type MetabolismStatus = 'growth' | 'maintenance' | 'consuming'

export interface MetabolismInputs {
  period: MetabolismPeriod
  lightIntensity: number
  carbonDioxide: number
  water: number
  temperature: number
  leafArea: number
}

export interface MetabolismFactors {
  light: number
  carbonDioxide: number
  water: number
  temperature: number
  leafArea: number
}

export interface MetabolismRates {
  effectiveLight: number
  factors: MetabolismFactors
  photosynthesisRate: number
  respirationRate: number
  netOrganicMatter: number
  oxygenBalance: number
  carbonDioxideBalance: number
  limitingFactor: LimitingFactor
  status: MetabolismStatus
}

export interface MetabolismTimePoint extends MetabolismRates {
  hour: number
}

const PERCENT_MIN = 0
const PERCENT_MAX = 100
const PHOTOSYNTHESIS_MAX_RATE = 100
const RESPIRATION_BASE_RATE = 14

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundRate(value: number) {
  return Math.round(value * 10) / 10
}

function percentFactor(value: number) {
  const normalizedValue = clamp(value, PERCENT_MIN, PERCENT_MAX) / PERCENT_MAX

  return Math.pow(normalizedValue, 0.72)
}

function photosynthesisTemperatureFactor(temperature: number) {
  const minimumTemperature = 5
  const optimumTemperature = 28
  const maximumTemperature = 45
  const floorFactor = 0.08

  if (temperature <= minimumTemperature || temperature >= maximumTemperature) {
    return floorFactor
  }

  if (temperature < optimumTemperature) {
    return (
      floorFactor +
      ((temperature - minimumTemperature) /
        (optimumTemperature - minimumTemperature)) *
        (1 - floorFactor)
    )
  }

  return (
    floorFactor +
    ((maximumTemperature - temperature) /
      (maximumTemperature - optimumTemperature)) *
      (1 - floorFactor)
  )
}

function respirationTemperatureFactor(temperature: number) {
  return 0.55 + clamp((temperature - 5) / 35, 0, 1) * 1.25
}

function getLimitingFactor(
  factors: MetabolismFactors,
  period: MetabolismPeriod,
): LimitingFactor {
  if (period === 'night') {
    return 'light'
  }

  const sortedFactors = Object.entries(factors).sort(
    ([, leftValue], [, rightValue]) => leftValue - rightValue,
  )
  const [factorName, factorValue] = sortedFactors[0] ?? ['none', 1]

  return factorValue < 0.92 ? (factorName as LimitingFactor) : 'none'
}

function getMetabolismStatus(netOrganicMatter: number): MetabolismStatus {
  if (netOrganicMatter > 3) {
    return 'growth'
  }

  if (netOrganicMatter < -3) {
    return 'consuming'
  }

  return 'maintenance'
}

export function calculateMetabolism(
  inputs: MetabolismInputs,
): MetabolismRates {
  const effectiveLight =
    inputs.period === 'day' ? clamp(inputs.lightIntensity, 0, 100) : 0
  const factors: MetabolismFactors = {
    light: inputs.period === 'day' ? percentFactor(effectiveLight) : 0,
    carbonDioxide: percentFactor(inputs.carbonDioxide),
    water: percentFactor(inputs.water),
    temperature: photosynthesisTemperatureFactor(inputs.temperature),
    leafArea: clamp(inputs.leafArea, 0, 100) / 100,
  }
  const photosynthesisRate = roundRate(
    PHOTOSYNTHESIS_MAX_RATE *
      factors.light *
      factors.carbonDioxide *
      factors.water *
      factors.temperature *
      factors.leafArea,
  )
  const plantSizeFactor = 0.6 + factors.leafArea * 0.8
  const respirationRate = roundRate(
    RESPIRATION_BASE_RATE *
      plantSizeFactor *
      respirationTemperatureFactor(inputs.temperature),
  )
  const netOrganicMatter = roundRate(photosynthesisRate - respirationRate)

  return {
    effectiveLight,
    factors,
    photosynthesisRate,
    respirationRate,
    netOrganicMatter,
    oxygenBalance: netOrganicMatter,
    carbonDioxideBalance: roundRate(-netOrganicMatter),
    limitingFactor: getLimitingFactor(factors, inputs.period),
    status: getMetabolismStatus(netOrganicMatter),
  }
}

export function generateMetabolismDayCycle(
  inputs: MetabolismInputs,
): MetabolismTimePoint[] {
  return Array.from({ length: 25 }, (_, hour) => {
    const isDaylightHour = hour >= 6 && hour <= 18
    const daylightCurve = isDaylightHour
      ? Math.sin(((hour - 6) / 12) * Math.PI)
      : 0
    const adjustedInputs: MetabolismInputs = {
      ...inputs,
      period: isDaylightHour ? 'day' : 'night',
      lightIntensity: inputs.lightIntensity * daylightCurve,
      temperature: inputs.temperature + daylightCurve * 3 - (1 - daylightCurve) * 2,
    }

    return {
      hour,
      ...calculateMetabolism(adjustedInputs),
    }
  })
}
