import { useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  Activity,
  Bird,
  Bug,
  Leaf,
  Rabbit,
  RotateCcw,
  ShieldAlert,
  Skull,
  Sprout,
  Target,
  TrendingUp,
  Waves,
} from 'lucide-react'

import { localize, type LocalizedText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import {
  DEFAULT_ECOSYSTEM_INPUTS,
  ECOSYSTEM_SPECIES,
  FOOD_WEB_LINKS,
  simulateEcosystem,
  type EcosystemInputs,
  type EcosystemObservationCode,
  type EcosystemSpecies,
  type EcosystemSpeciesId,
  type EcosystemStatus,
  type EcosystemTimePoint,
} from '../utils/ecosystem'

type ScenarioId = 'balanced' | 'removeProducer' | 'predatorBoost' | 'pollution'

interface SpeciesVisual {
  label: LocalizedText
  role: LocalizedText
  color: string
  icon: ReactNode
}

const speciesVisuals: Record<EcosystemSpeciesId, SpeciesVisual> = {
  plant: {
    label: {
      fr: 'Plantes',
      zh: '水草/植物',
    },
    role: {
      fr: 'Producteur',
      zh: '生产者',
    },
    color: '#16a34a',
    icon: <Leaf size={18} aria-hidden="true" />,
  },
  grasshopper: {
    label: {
      fr: 'Criquets',
      zh: '蝗虫',
    },
    role: {
      fr: 'Consommateur primaire',
      zh: '初级消费者',
    },
    color: '#84cc16',
    icon: <Bug size={18} aria-hidden="true" />,
  },
  rabbit: {
    label: {
      fr: 'Lapins',
      zh: '野兔',
    },
    role: {
      fr: 'Consommateur primaire',
      zh: '初级消费者',
    },
    color: '#f59e0b',
    icon: <Rabbit size={18} aria-hidden="true" />,
  },
  frog: {
    label: {
      fr: 'Grenouilles',
      zh: '青蛙',
    },
    role: {
      fr: 'Consommateur secondaire',
      zh: '次级消费者',
    },
    color: '#0ea5e9',
    icon: <Waves size={18} aria-hidden="true" />,
  },
  snake: {
    label: {
      fr: 'Serpents',
      zh: '蛇',
    },
    role: {
      fr: 'Prédateur',
      zh: '捕食者',
    },
    color: '#7c3aed',
    icon: <Activity size={18} aria-hidden="true" />,
  },
  hawk: {
    label: {
      fr: 'Faucons',
      zh: '鹰',
    },
    role: {
      fr: 'Prédateur supérieur',
      zh: '顶级捕食者',
    },
    color: '#dc2626',
    icon: <Bird size={18} aria-hidden="true" />,
  },
  decomposer: {
    label: {
      fr: 'Décomposeurs',
      zh: '分解者',
    },
    role: {
      fr: 'Recycleur',
      zh: '物质循环',
    },
    color: '#a16207',
    icon: <Sprout size={18} aria-hidden="true" />,
  },
}

const nodePositions: Record<EcosystemSpeciesId, { x: number; y: number }> = {
  plant: { x: 96, y: 190 },
  grasshopper: { x: 250, y: 92 },
  rabbit: { x: 250, y: 276 },
  frog: { x: 420, y: 92 },
  snake: { x: 580, y: 190 },
  hawk: { x: 720, y: 190 },
  decomposer: { x: 420, y: 318 },
}

const text = {
  controlsEyebrow: {
    fr: 'Interventions',
    zh: '人为干预',
  },
  controlsTitle: {
    fr: "Réseau trophique",
    zh: '食物网控制',
  },
  scenarioLabel: {
    fr: 'Scénarios',
    zh: '情境按钮',
  },
  balancedScenario: {
    fr: 'Équilibre',
    zh: '平衡系统',
  },
  removeProducerScenario: {
    fr: 'Sans producteur',
    zh: '移除生产者',
  },
  predatorScenario: {
    fr: 'Plus de prédateurs',
    zh: '增加捕食者',
  },
  pollutionScenario: {
    fr: 'Pollution',
    zh: '污染冲击',
  },
  predatorBoost: {
    fr: 'Pression du prédateur supérieur',
    zh: '顶级捕食者增加',
  },
  pollution: {
    fr: 'Intensité de la pollution',
    zh: '污染强度',
  },
  speciesLabel: {
    fr: 'Espèces',
    zh: '物种开关',
  },
  remove: {
    fr: 'Retirer',
    zh: '移除',
  },
  restore: {
    fr: 'Restaurer',
    zh: '恢复',
  },
  reset: {
    fr: 'Réinitialiser',
    zh: '重置系统',
  },
  stageEyebrow: {
    fr: 'Modèle dynamique',
    zh: '动态模型',
  },
  stageTitle: {
    fr: "Écosystème et flux d'énergie",
    zh: '生态系统与能量流动',
  },
  foodWebTitle: {
    fr: 'Réseau alimentaire',
    zh: '食物网',
  },
  energyTitle: {
    fr: "Flux d'énergie",
    zh: '能量流动',
  },
  populationTitle: {
    fr: 'Populations dans le temps',
    zh: '种群数量变化',
  },
  observationsTitle: {
    fr: 'Ce que montre le modèle',
    zh: '模型观察',
  },
  stability: {
    fr: 'Stabilité',
    zh: '稳定性',
  },
  biodiversity: {
    fr: 'Biodiversité',
    zh: '生物多样性',
  },
  activeLinks: {
    fr: 'Relations actives',
    zh: '有效食物关系',
  },
  population: {
    fr: 'Population',
    zh: '种群数量',
  },
  lowFlow: {
    fr: "Flux d'énergie très faible",
    zh: '能量流动很弱',
  },
  modelNote: {
    fr: "Les flèches vont de l'organisme mangé vers le consommateur: elles montrent le transfert d'énergie.",
    zh: '箭头从被取食的生物指向消费者，表示能量传递方向。',
  },
}

const statusLabels: Record<EcosystemStatus, LocalizedText> = {
  balanced: {
    fr: 'Équilibre relatif',
    zh: '相对平衡',
  },
  stressed: {
    fr: 'Système perturbé',
    zh: '系统受扰动',
  },
  collapse: {
    fr: 'Risque d’effondrement',
    zh: '有崩溃风险',
  },
}

const observationLabels: Record<EcosystemObservationCode, LocalizedText> = {
  balanced: {
    fr: 'Les producteurs, consommateurs et décomposeurs restent tous présents; le réseau peut encore transférer de l’énergie.',
    zh: '生产者、消费者和分解者都还存在，食物网能够持续传递能量。',
  },
  foodWebBroken: {
    fr: 'Une espèce retirée coupe une partie du réseau: les effets se propagent aux autres niveaux trophiques.',
    zh: '移除一个物种会切断部分食物关系，影响会沿着营养级继续传递。',
  },
  producerRemoved: {
    fr: 'Sans producteur, l’entrée principale d’énergie disparaît et les consommateurs déclinent.',
    zh: '没有生产者，生态系统的主要能量入口消失，消费者会连锁下降。',
  },
  producerCollapse: {
    fr: 'Les producteurs sont trop faibles; les consommateurs n’ont plus assez de matière organique à utiliser.',
    zh: '生产者数量过低，消费者缺少足够的有机物来源。',
  },
  herbivoreOutbreak: {
    fr: 'Les herbivores deviennent trop nombreux et exercent une forte pression sur les producteurs.',
    zh: '植食动物数量偏高，会对生产者形成明显取食压力。',
  },
  topPredatorPressure: {
    fr: 'Un prédateur supérieur trop abondant réduit fortement les proies disponibles.',
    zh: '顶级捕食者过多，会明显压低被捕食者数量。',
  },
  pollutionStress: {
    fr: 'La pollution réduit la capacité de survie; les espèces sensibles chutent plus vite.',
    zh: '污染会降低生存能力，敏感物种下降更明显。',
  },
  decomposerMissing: {
    fr: 'Sans décomposeurs, le recyclage de la matière est affaibli et les producteurs perdent du soutien.',
    zh: '缺少分解者会削弱物质循环，生产者得到的支持减少。',
  },
}

function createScenarioInputs(scenario: ScenarioId): EcosystemInputs {
  if (scenario === 'removeProducer') {
    return {
      ...DEFAULT_ECOSYSTEM_INPUTS,
      activeSpecies: {
        ...DEFAULT_ECOSYSTEM_INPUTS.activeSpecies,
        plant: false,
      },
    }
  }

  if (scenario === 'predatorBoost') {
    return {
      ...DEFAULT_ECOSYSTEM_INPUTS,
      predatorBoost: 82,
    }
  }

  if (scenario === 'pollution') {
    return {
      ...DEFAULT_ECOSYSTEM_INPUTS,
      pollution: 76,
    }
  }

  return DEFAULT_ECOSYSTEM_INPUTS
}

function formatPopulation(value: number) {
  return value.toFixed(1)
}

function getPopulationRatio(species: EcosystemSpecies, population: number) {
  return Math.min(1, population / species.carryingCapacity)
}

function PopulationChart({
  history,
  speciesLabels,
}: {
  history: EcosystemTimePoint[]
  speciesLabels: Record<EcosystemSpeciesId, string>
}) {
  const width = 720
  const height = 260
  const padding = {
    top: 20,
    right: 20,
    bottom: 34,
    left: 40,
  }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxPopulation = Math.max(
    40,
    ...history.flatMap((point) =>
      ECOSYSTEM_SPECIES.map((species) => point.populations[species.id]),
    ),
  )
  const x = (step: number) =>
    padding.left + (step / (history.length - 1)) * plotWidth
  const y = (population: number) =>
    padding.top + plotHeight - (population / maxPopulation) * plotHeight
  const linePath = (speciesId: EcosystemSpeciesId) =>
    history
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'

        return `${command} ${x(point.step).toFixed(1)} ${y(
          point.populations[speciesId],
        ).toFixed(1)}`
      })
      .join(' ')

  return (
    <svg
      className="ecosystem-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Population chart"
    >
      <line
        className="chart-axis"
        x1={padding.left}
        y1={padding.top + plotHeight}
        x2={padding.left + plotWidth}
        y2={padding.top + plotHeight}
      />
      <line
        className="chart-axis"
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + plotHeight}
      />
      {[0, 8, 16, 24, 32].map((step) => (
        <g key={step}>
          <line
            className="chart-grid-line"
            x1={x(step)}
            y1={padding.top}
            x2={x(step)}
            y2={padding.top + plotHeight}
          />
          <text className="chart-tick" x={x(step)} y={height - 10}>
            {step}
          </text>
        </g>
      ))}
      {ECOSYSTEM_SPECIES.map((species) => (
        <path
          className="ecosystem-chart-line"
          d={linePath(species.id)}
          key={species.id}
          style={
            {
              '--species-color': speciesVisuals[species.id].color,
            } as CSSProperties
          }
        />
      ))}
      <g className="ecosystem-chart-legend" transform="translate(48 15)">
        {ECOSYSTEM_SPECIES.map((species, index) => (
          <g
            key={species.id}
            transform={`translate(${(index % 4) * 150} ${Math.floor(index / 4) * 18})`}
          >
            <circle
              r="4"
              cx="0"
              cy="0"
              fill={speciesVisuals[species.id].color}
            />
            <text x="8" y="4">
              {speciesLabels[species.id]}
            </text>
          </g>
        ))}
      </g>
    </svg>
  )
}

function FoodWebDiagram({
  result,
  speciesLabels,
}: {
  result: ReturnType<typeof simulateEcosystem>
  speciesLabels: Record<EcosystemSpeciesId, string>
}) {
  return (
    <svg
      className="food-web-diagram"
      viewBox="0 0 820 380"
      role="img"
      aria-label="Food web"
    >
      <defs>
        <marker
          id="food-web-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#475569" />
        </marker>
      </defs>
      {FOOD_WEB_LINKS.map((link) => {
        const source = nodePositions[link.source]
        const target = nodePositions[link.target]
        const activeFlow = result.energyFlows.find(
          (flow) => flow.source === link.source && flow.target === link.target,
        )

        return (
          <line
            className={`food-web-link ${activeFlow ? 'is-active' : 'is-muted'}`}
            key={`${link.source}-${link.target}`}
            markerEnd="url(#food-web-arrow)"
            x1={source.x}
            x2={target.x}
            y1={source.y}
            y2={target.y}
          />
        )
      })}
      <path
        className="food-web-recycle-link"
        d={`M ${nodePositions.decomposer.x - 36} ${nodePositions.decomposer.y - 22} C 220 330, 120 270, ${nodePositions.plant.x + 18} ${nodePositions.plant.y + 28}`}
        markerEnd="url(#food-web-arrow)"
      />
      {ECOSYSTEM_SPECIES.map((species) => {
        const position = nodePositions[species.id]
        const population = result.finalPopulations[species.id]
        const ratio = getPopulationRatio(species, population)
        const radius = 26 + ratio * 18

        return (
          <g
            className={`food-web-node ${population <= 1 ? 'is-empty' : ''}`}
            key={species.id}
            transform={`translate(${position.x} ${position.y})`}
          >
            <circle
              r={radius}
              fill={speciesVisuals[species.id].color}
              opacity={population <= 1 ? 0.16 : 0.22 + ratio * 0.5}
            />
            <circle
              className="food-web-node-ring"
              r={radius}
              stroke={speciesVisuals[species.id].color}
            />
            <text className="food-web-node-label" y="-4">
              {speciesLabels[species.id]}
            </text>
            <text className="food-web-node-value" y="16">
              {formatPopulation(population)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function EcosystemLab() {
  const { language } = useLanguage()
  const [inputs, setInputs] = useState<EcosystemInputs>(
    DEFAULT_ECOSYSTEM_INPUTS,
  )
  const result = useMemo(() => simulateEcosystem(inputs), [inputs])
  const speciesLabels = useMemo(
    () =>
      Object.fromEntries(
        ECOSYSTEM_SPECIES.map((species) => [
          species.id,
          localize(speciesVisuals[species.id].label, language),
        ]),
      ) as Record<EcosystemSpeciesId, string>,
    [language],
  )
  const activeLinkCount = result.energyFlows.filter(
    (flow) => flow.amount > 0.5,
  ).length
  const scenarios: Array<{
    id: ScenarioId
    label: LocalizedText
    icon: ReactNode
  }> = [
    {
      id: 'balanced',
      label: text.balancedScenario,
      icon: <Target size={16} aria-hidden="true" />,
    },
    {
      id: 'removeProducer',
      label: text.removeProducerScenario,
      icon: <Skull size={16} aria-hidden="true" />,
    },
    {
      id: 'predatorBoost',
      label: text.predatorScenario,
      icon: <Bird size={16} aria-hidden="true" />,
    },
    {
      id: 'pollution',
      label: text.pollutionScenario,
      icon: <ShieldAlert size={16} aria-hidden="true" />,
    },
  ]

  const setScenario = (scenario: ScenarioId) => {
    setInputs(createScenarioInputs(scenario))
  }

  const toggleSpecies = (speciesId: EcosystemSpeciesId) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      activeSpecies: {
        ...currentInputs.activeSpecies,
        [speciesId]: !currentInputs.activeSpecies[speciesId],
      },
    }))
  }

  const updateSlider = (key: 'predatorBoost' | 'pollution', value: number) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: value,
    }))
  }

  return (
    <div className="ecosystem-workspace">
      <aside className="sidebar ecosystem-sidebar">
        <section className="panel ecosystem-controls" aria-labelledby="ecosystem-controls-title">
          <div className="panel-heading">
            <p className="eyebrow">{localize(text.controlsEyebrow, language)}</p>
            <h2 id="ecosystem-controls-title">
              {localize(text.controlsTitle, language)}
            </h2>
          </div>

          <div className="ecosystem-scenarios" aria-label={localize(text.scenarioLabel, language)}>
            {scenarios.map((scenario) => (
              <button
                className="ecosystem-scenario-button"
                key={scenario.id}
                type="button"
                onClick={() => setScenario(scenario.id)}
              >
                {scenario.icon}
                <span>{localize(scenario.label, language)}</span>
              </button>
            ))}
          </div>

          <div className="ecosystem-slider-list">
            <label className="ecosystem-slider" htmlFor="ecosystem-predator">
              <span className="slider-label-row">
                <span className="slider-label">
                  <Bird size={18} aria-hidden="true" />
                  <span>{localize(text.predatorBoost, language)}</span>
                </span>
                <output htmlFor="ecosystem-predator">
                  {inputs.predatorBoost}%
                </output>
              </span>
              <input
                id="ecosystem-predator"
                max="100"
                min="0"
                type="range"
                value={inputs.predatorBoost}
                onChange={(event) =>
                  updateSlider('predatorBoost', Number(event.currentTarget.value))
                }
              />
            </label>

            <label className="ecosystem-slider" htmlFor="ecosystem-pollution">
              <span className="slider-label-row">
                <span className="slider-label">
                  <ShieldAlert size={18} aria-hidden="true" />
                  <span>{localize(text.pollution, language)}</span>
                </span>
                <output htmlFor="ecosystem-pollution">
                  {inputs.pollution}%
                </output>
              </span>
              <input
                id="ecosystem-pollution"
                max="100"
                min="0"
                type="range"
                value={inputs.pollution}
                onChange={(event) =>
                  updateSlider('pollution', Number(event.currentTarget.value))
                }
              />
            </label>
          </div>

          <button
            type="button"
            className="control-button ecosystem-reset-button"
            onClick={() => setInputs(DEFAULT_ECOSYSTEM_INPUTS)}
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span>{localize(text.reset, language)}</span>
          </button>
        </section>

        <section className="panel species-toggle-panel" aria-labelledby="species-toggle-title">
          <div className="panel-heading">
            <p className="eyebrow">{localize(text.speciesLabel, language)}</p>
            <h2 id="species-toggle-title">
              {localize(text.population, language)}
            </h2>
          </div>

          <div className="species-toggle-list">
            {ECOSYSTEM_SPECIES.map((species) => {
              const isActive = inputs.activeSpecies[species.id]
              const visual = speciesVisuals[species.id]
              const population = result.finalPopulations[species.id]

              return (
                <button
                  type="button"
                  className={`species-toggle ${isActive ? 'is-active' : 'is-removed'}`}
                  key={species.id}
                  style={
                    {
                      '--species-color': visual.color,
                    } as CSSProperties
                  }
                  onClick={() => toggleSpecies(species.id)}
                >
                  <span className="species-toggle-icon">{visual.icon}</span>
                  <span className="species-toggle-copy">
                    <strong>{localize(visual.label, language)}</strong>
                    <small>{localize(visual.role, language)}</small>
                  </span>
                  <span className="species-toggle-value">
                    {isActive
                      ? formatPopulation(population)
                      : localize(text.restore, language)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </aside>

      <section
        className={`panel ecosystem-stage is-${result.status}`}
        aria-labelledby="ecosystem-stage-title"
      >
        <div className="panel-heading ecosystem-stage-heading">
          <div>
            <p className="eyebrow">{localize(text.stageEyebrow, language)}</p>
            <h2 id="ecosystem-stage-title">
              {localize(text.stageTitle, language)}
            </h2>
          </div>
          <p className="ecosystem-status">
            {localize(statusLabels[result.status], language)}
          </p>
        </div>

        <div className="ecosystem-metrics">
          <div>
            <span>{localize(text.stability, language)}</span>
            <strong>{result.stabilityScore}</strong>
          </div>
          <div>
            <span>{localize(text.biodiversity, language)}</span>
            <strong>{result.biodiversityScore}</strong>
          </div>
          <div>
            <span>{localize(text.activeLinks, language)}</span>
            <strong>{activeLinkCount}</strong>
          </div>
        </div>

        <div className="ecosystem-grid">
          <section className="ecosystem-card food-web-card" aria-labelledby="food-web-title">
            <div className="ecosystem-card-heading">
              <Leaf size={18} aria-hidden="true" />
              <h3 id="food-web-title">{localize(text.foodWebTitle, language)}</h3>
            </div>
            <FoodWebDiagram result={result} speciesLabels={speciesLabels} />
            <p className="ecosystem-model-note">
              {localize(text.modelNote, language)}
            </p>
          </section>

          <section className="ecosystem-card energy-flow-card" aria-labelledby="energy-flow-title">
            <div className="ecosystem-card-heading">
              <TrendingUp size={18} aria-hidden="true" />
              <h3 id="energy-flow-title">
                {localize(text.energyTitle, language)}
              </h3>
            </div>
            <div className="energy-flow-list">
              {result.energyFlows.length > 0 ? (
                result.energyFlows
                  .slice()
                  .sort((left, right) => right.amount - left.amount)
                  .slice(0, 6)
                  .map((flow) => (
                    <div className="energy-flow-row" key={`${flow.source}-${flow.target}`}>
                      <span>
                        {speciesLabels[flow.source]} {'->'}{' '}
                        {speciesLabels[flow.target]}
                      </span>
                      <strong>{flow.amount.toFixed(1)}</strong>
                    </div>
                  ))
              ) : (
                <p className="ecosystem-empty-flow">
                  {localize(text.lowFlow, language)}
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="ecosystem-card ecosystem-observations" aria-labelledby="ecosystem-observations-title">
          <div className="ecosystem-card-heading">
            <ShieldAlert size={18} aria-hidden="true" />
            <h3 id="ecosystem-observations-title">
              {localize(text.observationsTitle, language)}
            </h3>
          </div>
          <div className="observation-list">
            {result.observationCodes.map((code) => (
              <p key={code}>{localize(observationLabels[code], language)}</p>
            ))}
          </div>
        </section>

        <section className="ecosystem-card population-chart-card" aria-labelledby="ecosystem-chart-title">
          <div className="ecosystem-card-heading">
            <TrendingUp size={18} aria-hidden="true" />
            <h3 id="ecosystem-chart-title">
              {localize(text.populationTitle, language)}
            </h3>
          </div>
          <PopulationChart history={result.history} speciesLabels={speciesLabels} />
        </section>
      </section>
    </div>
  )
}
