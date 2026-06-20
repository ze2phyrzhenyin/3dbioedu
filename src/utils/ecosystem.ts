export type EcosystemSpeciesId =
  | 'plant'
  | 'grasshopper'
  | 'rabbit'
  | 'frog'
  | 'snake'
  | 'hawk'
  | 'decomposer'

export type EcosystemRole =
  | 'producer'
  | 'primaryConsumer'
  | 'secondaryConsumer'
  | 'topPredator'
  | 'decomposer'

export type EcosystemStatus = 'balanced' | 'stressed' | 'collapse'

export type EcosystemObservationCode =
  | 'balanced'
  | 'foodWebBroken'
  | 'producerRemoved'
  | 'producerCollapse'
  | 'herbivoreOutbreak'
  | 'topPredatorPressure'
  | 'pollutionStress'
  | 'decomposerMissing'

export interface EcosystemSpecies {
  id: EcosystemSpeciesId
  role: EcosystemRole
  initialPopulation: number
  carryingCapacity: number
  growthRate: number
  foodNeed: number
  pollutionSensitivity: number
  trophicLevel: number
}

export interface FoodWebLink {
  source: EcosystemSpeciesId
  target: EcosystemSpeciesId
  strength: number
}

export interface EcosystemInputs {
  activeSpecies: Record<EcosystemSpeciesId, boolean>
  predatorBoost: number
  pollution: number
}

export interface EcosystemTimePoint {
  step: number
  populations: Record<EcosystemSpeciesId, number>
}

export interface EcosystemEnergyFlow extends FoodWebLink {
  amount: number
}

export interface EcosystemResult {
  history: EcosystemTimePoint[]
  finalPopulations: Record<EcosystemSpeciesId, number>
  energyFlows: EcosystemEnergyFlow[]
  stabilityScore: number
  biodiversityScore: number
  status: EcosystemStatus
  observationCodes: EcosystemObservationCode[]
}

export const ECOSYSTEM_SPECIES: EcosystemSpecies[] = [
  {
    id: 'plant',
    role: 'producer',
    initialPopulation: 82,
    carryingCapacity: 118,
    growthRate: 0.34,
    foodNeed: 0,
    pollutionSensitivity: 0.74,
    trophicLevel: 1,
  },
  {
    id: 'grasshopper',
    role: 'primaryConsumer',
    initialPopulation: 52,
    carryingCapacity: 105,
    growthRate: 0.22,
    foodNeed: 0.76,
    pollutionSensitivity: 0.52,
    trophicLevel: 2,
  },
  {
    id: 'rabbit',
    role: 'primaryConsumer',
    initialPopulation: 44,
    carryingCapacity: 88,
    growthRate: 0.18,
    foodNeed: 0.82,
    pollutionSensitivity: 0.43,
    trophicLevel: 2,
  },
  {
    id: 'frog',
    role: 'secondaryConsumer',
    initialPopulation: 30,
    carryingCapacity: 58,
    growthRate: 0.14,
    foodNeed: 0.9,
    pollutionSensitivity: 0.88,
    trophicLevel: 3,
  },
  {
    id: 'snake',
    role: 'secondaryConsumer',
    initialPopulation: 20,
    carryingCapacity: 44,
    growthRate: 0.1,
    foodNeed: 0.9,
    pollutionSensitivity: 0.62,
    trophicLevel: 4,
  },
  {
    id: 'hawk',
    role: 'topPredator',
    initialPopulation: 12,
    carryingCapacity: 30,
    growthRate: 0.08,
    foodNeed: 0.96,
    pollutionSensitivity: 0.58,
    trophicLevel: 5,
  },
  {
    id: 'decomposer',
    role: 'decomposer',
    initialPopulation: 46,
    carryingCapacity: 74,
    growthRate: 0.2,
    foodNeed: 0,
    pollutionSensitivity: 0.35,
    trophicLevel: 0,
  },
]

export const FOOD_WEB_LINKS: FoodWebLink[] = [
  { source: 'plant', target: 'grasshopper', strength: 0.86 },
  { source: 'plant', target: 'rabbit', strength: 0.7 },
  { source: 'grasshopper', target: 'frog', strength: 0.84 },
  { source: 'rabbit', target: 'snake', strength: 0.52 },
  { source: 'frog', target: 'snake', strength: 0.62 },
  { source: 'rabbit', target: 'hawk', strength: 0.48 },
  { source: 'frog', target: 'hawk', strength: 0.34 },
  { source: 'snake', target: 'hawk', strength: 0.58 },
]

export const DEFAULT_ECOSYSTEM_INPUTS: EcosystemInputs = {
  activeSpecies: {
    plant: true,
    grasshopper: true,
    rabbit: true,
    frog: true,
    snake: true,
    hawk: true,
    decomposer: true,
  },
  predatorBoost: 0,
  pollution: 0,
}

const SPECIES_BY_ID = Object.fromEntries(
  ECOSYSTEM_SPECIES.map((species) => [species.id, species]),
) as Record<EcosystemSpeciesId, EcosystemSpecies>

const SIMULATION_STEPS = 32

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundPopulation(value: number) {
  return Math.round(value * 10) / 10
}

function createEmptyPopulations(): Record<EcosystemSpeciesId, number> {
  return {
    plant: 0,
    grasshopper: 0,
    rabbit: 0,
    frog: 0,
    snake: 0,
    hawk: 0,
    decomposer: 0,
  }
}

function getInitialPopulations(
  inputs: EcosystemInputs,
): Record<EcosystemSpeciesId, number> {
  const predatorBoostFactor = 1 + clamp(inputs.predatorBoost, 0, 100) / 100
  const populations = createEmptyPopulations()

  for (const species of ECOSYSTEM_SPECIES) {
    if (!inputs.activeSpecies[species.id]) {
      populations[species.id] = 0
      continue
    }

    const boostedPopulation =
      species.id === 'hawk'
        ? species.initialPopulation * (1 + predatorBoostFactor * 0.72)
        : species.initialPopulation

    populations[species.id] = clamp(
      boostedPopulation,
      0,
      species.carryingCapacity * 1.35,
    )
  }

  return populations
}

function getPredatorPressure(
  speciesId: EcosystemSpeciesId,
  populations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
) {
  const predatorMultiplier = 1 + clamp(inputs.predatorBoost, 0, 100) / 100 * 1.45

  return FOOD_WEB_LINKS.filter((link) => link.source === speciesId).reduce(
    (pressure, link) => {
      if (!inputs.activeSpecies[link.target]) {
        return pressure
      }

      const predator = SPECIES_BY_ID[link.target]
      const multiplier = link.target === 'hawk' ? predatorMultiplier : 1

      return (
        pressure +
        (populations[link.target] / predator.carryingCapacity) *
          link.strength *
          0.28 *
          multiplier
      )
    },
    0,
  )
}

function getPreyAvailability(
  speciesId: EcosystemSpeciesId,
  populations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
) {
  return FOOD_WEB_LINKS.filter((link) => link.target === speciesId).reduce(
    (availability, link) => {
      if (!inputs.activeSpecies[link.source]) {
        return availability
      }

      return availability + populations[link.source] * link.strength
    },
    0,
  )
}

function stepPopulation(
  species: EcosystemSpecies,
  populations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
) {
  if (!inputs.activeSpecies[species.id]) {
    return 0
  }

  const currentPopulation = populations[species.id]
  const pollutionStress = clamp(inputs.pollution, 0, 100) / 100

  if (species.role === 'producer') {
    const decomposerFactor = inputs.activeSpecies.decomposer
      ? 0.78 + (populations.decomposer / SPECIES_BY_ID.decomposer.carryingCapacity) * 0.26
      : 0.68
    const grazingLoss =
      populations.grasshopper * 0.07 + populations.rabbit * 0.085
    const growth =
      currentPopulation *
      species.growthRate *
      decomposerFactor *
      (1 - currentPopulation / species.carryingCapacity) *
      (1 - pollutionStress * 0.68)
    const pollutionLoss =
      currentPopulation * pollutionStress * species.pollutionSensitivity * 0.075

    return clamp(
      currentPopulation + growth - grazingLoss - pollutionLoss,
      0,
      species.carryingCapacity * 1.35,
    )
  }

  if (species.role === 'decomposer') {
    const livingBiomass = ECOSYSTEM_SPECIES.filter(
      (candidate) => candidate.id !== 'decomposer',
    ).reduce((total, candidate) => total + populations[candidate.id], 0)
    const detritusTarget = clamp(
      16 + livingBiomass * (0.075 + pollutionStress * 0.018),
      8,
      species.carryingCapacity,
    )
    const adjustment = (detritusTarget - currentPopulation) * species.growthRate
    const pollutionLoss =
      currentPopulation * pollutionStress * species.pollutionSensitivity * 0.045

    return clamp(
      currentPopulation + adjustment - pollutionLoss,
      0,
      species.carryingCapacity * 1.2,
    )
  }

  const preyAvailability = getPreyAvailability(species.id, populations, inputs)
  const foodNeed = Math.max(1, currentPopulation * species.foodNeed)
  const foodScore = clamp(preyAvailability / foodNeed, 0, 1.65)
  const predatorPressure = getPredatorPressure(species.id, populations, inputs)
  const foodGrowth = currentPopulation * species.growthRate * (foodScore - 0.58)
  const predationLoss = currentPopulation * predatorPressure
  const naturalLoss = currentPopulation * 0.023
  const pollutionLoss =
    currentPopulation * pollutionStress * species.pollutionSensitivity * 0.06
  const crowdingLoss =
    currentPopulation *
    Math.pow(currentPopulation / species.carryingCapacity, 2) *
    0.03

  return clamp(
    currentPopulation +
      foodGrowth -
      predationLoss -
      naturalLoss -
      pollutionLoss -
      crowdingLoss,
    0,
    species.carryingCapacity * 1.35,
  )
}

function getNextPopulations(
  populations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
) {
  const nextPopulations = createEmptyPopulations()

  for (const species of ECOSYSTEM_SPECIES) {
    nextPopulations[species.id] = roundPopulation(
      stepPopulation(species, populations, inputs),
    )
  }

  return nextPopulations
}

function calculateEnergyFlows(
  finalPopulations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
): EcosystemEnergyFlow[] {
  return FOOD_WEB_LINKS.filter(
    (link) =>
      inputs.activeSpecies[link.source] &&
      inputs.activeSpecies[link.target] &&
      finalPopulations[link.source] > 1 &&
      finalPopulations[link.target] > 1,
  ).map((link) => {
    const target = SPECIES_BY_ID[link.target]
    const amount =
      finalPopulations[link.source] *
      (finalPopulations[link.target] / target.carryingCapacity) *
      link.strength *
      0.42

    return {
      ...link,
      amount: roundPopulation(amount),
    }
  })
}

function calculateBiodiversityScore(
  finalPopulations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
) {
  const activeCount = ECOSYSTEM_SPECIES.filter(
    (species) => inputs.activeSpecies[species.id],
  ).length
  const viableCount = ECOSYSTEM_SPECIES.filter(
    (species) =>
      inputs.activeSpecies[species.id] &&
      finalPopulations[species.id] >= species.initialPopulation * 0.22,
  ).length

  return activeCount === 0 ? 0 : Math.round((viableCount / activeCount) * 100)
}

function calculateStabilityScore(
  finalPopulations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
  biodiversityScore: number,
) {
  const inactiveCount = ECOSYSTEM_SPECIES.filter(
    (species) => !inputs.activeSpecies[species.id],
  ).length
  const collapsedCount = ECOSYSTEM_SPECIES.filter(
    (species) =>
      inputs.activeSpecies[species.id] &&
      finalPopulations[species.id] < species.initialPopulation * 0.18,
  ).length
  const herbivoreBiomass = finalPopulations.grasshopper + finalPopulations.rabbit
  const predatorBiomass =
    finalPopulations.frog + finalPopulations.snake + finalPopulations.hawk
  const imbalancePenalty = Math.min(
    24,
    Math.abs(herbivoreBiomass - predatorBiomass) * 0.12,
  )

  return Math.round(
    clamp(
      biodiversityScore -
        inactiveCount * 7 -
        collapsedCount * 12 -
        clamp(inputs.pollution, 0, 100) * 0.28 -
        imbalancePenalty,
      0,
      100,
    ),
  )
}

function getStatus(stabilityScore: number): EcosystemStatus {
  if (stabilityScore >= 72) {
    return 'balanced'
  }

  if (stabilityScore >= 42) {
    return 'stressed'
  }

  return 'collapse'
}

function getObservationCodes(
  finalPopulations: Record<EcosystemSpeciesId, number>,
  inputs: EcosystemInputs,
): EcosystemObservationCode[] {
  const observationCodes: EcosystemObservationCode[] = []
  const inactiveCount = ECOSYSTEM_SPECIES.filter(
    (species) => !inputs.activeSpecies[species.id],
  ).length
  const herbivoreBiomass = finalPopulations.grasshopper + finalPopulations.rabbit

  if (!inputs.activeSpecies.plant) {
    observationCodes.push('producerRemoved')
  } else if (finalPopulations.plant < SPECIES_BY_ID.plant.initialPopulation * 0.28) {
    observationCodes.push('producerCollapse')
  }

  if (inactiveCount > 0) {
    observationCodes.push('foodWebBroken')
  }

  if (
    inputs.activeSpecies.plant &&
    herbivoreBiomass >
      SPECIES_BY_ID.grasshopper.initialPopulation +
        SPECIES_BY_ID.rabbit.initialPopulation &&
    finalPopulations.plant < SPECIES_BY_ID.plant.initialPopulation * 0.6
  ) {
    observationCodes.push('herbivoreOutbreak')
  }

  if (
    inputs.predatorBoost >= 55 &&
    finalPopulations.rabbit < SPECIES_BY_ID.rabbit.initialPopulation * 0.5
  ) {
    observationCodes.push('topPredatorPressure')
  }

  if (inputs.pollution >= 45) {
    observationCodes.push('pollutionStress')
  }

  if (!inputs.activeSpecies.decomposer) {
    observationCodes.push('decomposerMissing')
  }

  if (observationCodes.length === 0) {
    observationCodes.push('balanced')
  }

  return observationCodes.slice(0, 4)
}

export function simulateEcosystem(inputs: EcosystemInputs): EcosystemResult {
  let populations = getInitialPopulations(inputs)
  const history: EcosystemTimePoint[] = [
    {
      step: 0,
      populations,
    },
  ]

  for (let step = 1; step <= SIMULATION_STEPS; step += 1) {
    populations = getNextPopulations(populations, inputs)
    history.push({
      step,
      populations,
    })
  }

  const biodiversityScore = calculateBiodiversityScore(populations, inputs)
  const stabilityScore = calculateStabilityScore(
    populations,
    inputs,
    biodiversityScore,
  )
  const status = getStatus(stabilityScore)

  return {
    history,
    finalPopulations: populations,
    energyFlows: calculateEnergyFlows(populations, inputs),
    stabilityScore,
    biodiversityScore,
    status,
    observationCodes: getObservationCodes(populations, inputs),
  }
}
