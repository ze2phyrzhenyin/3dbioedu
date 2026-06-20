import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Activity,
  Droplets,
  FlaskConical,
  Leaf,
  Moon,
  RotateCcw,
  Sprout,
  Sun,
  Target,
  Thermometer,
  TrendingUp,
  Wind,
} from 'lucide-react'

import { localize, type LocalizedText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import {
  calculateMetabolism,
  generateMetabolismDayCycle,
  type LimitingFactor,
  type MetabolismInputs,
  type MetabolismPeriod,
  type MetabolismStatus,
  type MetabolismTimePoint,
} from '../utils/metabolism'

type SliderKey = Exclude<keyof MetabolismInputs, 'period'>
type TaskId = 'conditions' | 'night' | 'greenhouse'

interface SliderConfig {
  key: SliderKey
  label: LocalizedText
  min: number
  max: number
  step: number
  unit: string
  icon: ReactNode
}

const initialInputs: MetabolismInputs = {
  period: 'day',
  lightIntensity: 72,
  carbonDioxide: 68,
  water: 74,
  temperature: 25,
  leafArea: 82,
}

const text = {
  controlsEyebrow: {
    fr: 'Variables',
    zh: '变量控制',
  },
  controlsTitle: {
    fr: 'Conditions du milieu',
    zh: '环境条件',
  },
  periodLabel: {
    fr: 'Cycle',
    zh: '昼夜状态',
  },
  day: {
    fr: 'Jour',
    zh: '白天',
  },
  night: {
    fr: 'Nuit',
    zh: '夜晚',
  },
  reset: {
    fr: 'Réinitialiser',
    zh: '重置条件',
  },
  light: {
    fr: 'Intensité lumineuse',
    zh: '光照强度',
  },
  carbonDioxide: {
    fr: 'Concentration en CO2',
    zh: '二氧化碳浓度',
  },
  water: {
    fr: 'Disponibilité en eau',
    zh: '水分供应',
  },
  temperature: {
    fr: 'Température',
    zh: '温度',
  },
  leafArea: {
    fr: 'Surface foliaire',
    zh: '叶片面积',
  },
  effectiveLight: {
    fr: 'Lumière efficace',
    zh: '有效光照',
  },
  stageEyebrow: {
    fr: 'Modèle dynamique',
    zh: '动态模型',
  },
  stageTitle: {
    fr: 'Bilan énergétique de la plante',
    zh: '植物能量收支',
  },
  daytimeNote: {
    fr: 'Avec de la lumière, la photosynthèse et la respiration ont lieu en même temps.',
    zh: '有光时，光合作用和呼吸作用同时进行。',
  },
  nighttimeNote: {
    fr: "Sans lumière, la photosynthèse s'arrête mais la respiration continue.",
    zh: '无光时，光合作用停止，但呼吸作用继续进行。',
  },
  photosynthesis: {
    fr: 'Photosynthèse',
    zh: '光合作用',
  },
  respiration: {
    fr: 'Respiration',
    zh: '呼吸作用',
  },
  netOrganicMatter: {
    fr: 'Bilan de matière organique',
    zh: '有机物净变化',
  },
  limitingFactor: {
    fr: 'Facteur limitant',
    zh: '主要限制因素',
  },
  oxygen: {
    fr: 'Oxygène',
    zh: '氧气',
  },
  carbonDioxideMetric: {
    fr: 'Dioxyde de carbone',
    zh: '二氧化碳',
  },
  release: {
    fr: 'libéré',
    zh: '释放',
  },
  absorb: {
    fr: 'absorbé',
    zh: '吸收',
  },
  balanced: {
    fr: 'presque équilibré',
    zh: '基本平衡',
  },
  rateUnit: {
    fr: 'u/min',
    zh: '单位/分',
  },
  equationTitle: {
    fr: 'Deux réactions à comparer',
    zh: '两条反应式对照',
  },
  photosynthesisEquation: {
    fr: 'CO2 + eau --lumière / chloroplastes--> matière organique + O2',
    zh: '二氧化碳 + 水 --光能 / 叶绿体--> 有机物 + 氧气',
  },
  respirationEquation: {
    fr: 'Matière organique + O2 --> CO2 + eau + énergie',
    zh: '有机物 + 氧气 --> 二氧化碳 + 水 + 能量',
  },
  chartTitle: {
    fr: 'Variation sur 24 heures',
    zh: '24 小时速率变化',
  },
  taskEyebrow: {
    fr: 'Défis',
    zh: '任务关卡',
  },
  taskTitle: {
    fr: 'Questions de classe',
    zh: '课堂探究',
  },
  success: {
    fr: 'Objectif atteint',
    zh: '目标达成',
  },
  pending: {
    fr: 'À vérifier',
    zh: '继续调整',
  },
}

const statusLabels: Record<MetabolismStatus, LocalizedText> = {
  growth: {
    fr: 'Accumulation nette',
    zh: '净积累',
  },
  maintenance: {
    fr: 'Bilan proche de zéro',
    zh: '接近平衡',
  },
  consuming: {
    fr: 'Consommation nette',
    zh: '净消耗',
  },
}

const factorLabels: Record<LimitingFactor, LocalizedText> = {
  light: {
    fr: 'Lumière',
    zh: '光照',
  },
  carbonDioxide: {
    fr: 'CO2',
    zh: '二氧化碳',
  },
  water: {
    fr: 'Eau',
    zh: '水分',
  },
  temperature: {
    fr: 'Température',
    zh: '温度',
  },
  leafArea: {
    fr: 'Surface foliaire',
    zh: '叶片面积',
  },
  none: {
    fr: 'Aucun évident',
    zh: '暂无明显限制',
  },
}

const tasks: Array<{
  id: TaskId
  title: LocalizedText
  prompt: LocalizedText
  pending: LocalizedText
  success: LocalizedText
}> = [
  {
    id: 'conditions',
    title: {
      fr: 'Conditions nécessaires',
      zh: '必要条件',
    },
    prompt: {
      fr: "Faites disparaître un facteur essentiel et observez la chute de la photosynthèse.",
      zh: '把一个必要条件降到很低，观察光合速率接近停止。',
    },
    pending: {
      fr: 'Essayez une lumière, un CO2 ou une eau très faible.',
      zh: '可以尝试把光照、二氧化碳或水分调到很低。',
    },
    success: {
      fr: 'La photosynthèse chute fortement quand un facteur essentiel manque.',
      zh: '缺少必要条件时，光合作用会明显下降。',
    },
  },
  {
    id: 'night',
    title: {
      fr: 'Nuit et respiration',
      zh: '夜间呼吸',
    },
    prompt: {
      fr: 'Passez en mode nuit et comparez les deux processus.',
      zh: '切换到夜晚，对比光合作用和呼吸作用。',
    },
    pending: {
      fr: 'Passez en nuit: la respiration doit rester active.',
      zh: '切到夜晚后，呼吸作用仍应保持进行。',
    },
    success: {
      fr: "La nuit, la photosynthèse est nulle mais la respiration consomme encore de la matière organique.",
      zh: '夜间光合作用为 0，但呼吸作用仍会消耗有机物。',
    },
  },
  {
    id: 'greenhouse',
    title: {
      fr: 'Serre productive',
      zh: '温室增产',
    },
    prompt: {
      fr: 'Ajustez les conditions pour obtenir un fort bilan positif.',
      zh: '调节条件，让有机物净积累尽可能高。',
    },
    pending: {
      fr: 'Augmentez lumière, CO2 et eau, puis rapprochez la température de 28 °C.',
      zh: '提高光照、二氧化碳和水分，并让温度接近 28°C。',
    },
    success: {
      fr: 'Les conditions sont favorables: la matière organique augmente nettement.',
      zh: '条件较适宜，有机物正在明显积累。',
    },
  },
]

function formatRate(value: number) {
  return value.toFixed(1)
}

function formatBalance(
  value: number,
  releaseLabel: string,
  absorbLabel: string,
  balancedLabel: string,
) {
  if (Math.abs(value) < 0.5) {
    return balancedLabel
  }

  return `${Math.abs(value).toFixed(1)} ${value > 0 ? releaseLabel : absorbLabel}`
}

function getTaskComplete(
  taskId: TaskId,
  inputs: MetabolismInputs,
  photosynthesisRate: number,
  respirationRate: number,
  netOrganicMatter: number,
) {
  if (taskId === 'conditions') {
    const missingCoreFactor =
      inputs.period === 'night' ||
      inputs.lightIntensity <= 8 ||
      inputs.carbonDioxide <= 8 ||
      inputs.water <= 8

    return missingCoreFactor && photosynthesisRate <= 4
  }

  if (taskId === 'night') {
    return inputs.period === 'night' && photosynthesisRate === 0 && respirationRate > 0
  }

  return inputs.period === 'day' && netOrganicMatter >= 35
}

function RateChart({
  points,
  currentHour,
  photosynthesisLabel,
  respirationLabel,
}: {
  points: MetabolismTimePoint[]
  currentHour: number
  photosynthesisLabel: string
  respirationLabel: string
}) {
  const width = 520
  const height = 220
  const padding = {
    top: 18,
    right: 18,
    bottom: 34,
    left: 38,
  }
  const plotWidth = width - padding.left - padding.right
  const plotHeight = height - padding.top - padding.bottom
  const maxRate = Math.max(
    40,
    ...points.map((point) =>
      Math.max(point.photosynthesisRate, point.respirationRate),
    ),
  )
  const x = (hour: number) => padding.left + (hour / 24) * plotWidth
  const y = (value: number) =>
    padding.top + plotHeight - (value / maxRate) * plotHeight
  const linePath = (
    rateAccessor: (point: MetabolismTimePoint) => number,
  ) =>
    points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'

        return `${command} ${x(point.hour).toFixed(1)} ${y(rateAccessor(point)).toFixed(1)}`
      })
      .join(' ')
  const markerX = x(currentHour)

  return (
    <svg
      className="metabolism-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${photosynthesisLabel} / ${respirationLabel}`}
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
      {[0, 6, 12, 18, 24].map((hour) => (
        <g key={hour}>
          <line
            className="chart-grid-line"
            x1={x(hour)}
            y1={padding.top}
            x2={x(hour)}
            y2={padding.top + plotHeight}
          />
          <text className="chart-tick" x={x(hour)} y={height - 10}>
            {hour}
          </text>
        </g>
      ))}
      <path
        className="chart-line chart-line-photosynthesis"
        d={linePath((point) => point.photosynthesisRate)}
      />
      <path
        className="chart-line chart-line-respiration"
        d={linePath((point) => point.respirationRate)}
      />
      <line
        className="chart-current-hour"
        x1={markerX}
        y1={padding.top}
        x2={markerX}
        y2={padding.top + plotHeight}
      />
      <g className="chart-legend" transform={`translate(${padding.left}, 14)`}>
        <circle className="legend-dot is-photosynthesis" cx="0" cy="0" r="4" />
        <text x="8" y="4">
          {photosynthesisLabel}
        </text>
        <circle className="legend-dot is-respiration" cx="138" cy="0" r="4" />
        <text x="146" y="4">
          {respirationLabel}
        </text>
      </g>
    </svg>
  )
}

export function PhotosynthesisLab() {
  const { language } = useLanguage()
  const [inputs, setInputs] = useState<MetabolismInputs>(initialInputs)
  const [activeTaskId, setActiveTaskId] = useState<TaskId>('night')
  const rates = useMemo(() => calculateMetabolism(inputs), [inputs])
  const dayCycle = useMemo(
    () => generateMetabolismDayCycle(inputs),
    [inputs],
  )
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? tasks[0]
  const taskComplete = getTaskComplete(
    activeTask.id,
    inputs,
    rates.photosynthesisRate,
    rates.respirationRate,
    rates.netOrganicMatter,
  )
  const sliderConfigs: SliderConfig[] = [
    {
      key: 'lightIntensity',
      label: text.light,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      icon: <Sun size={18} aria-hidden="true" />,
    },
    {
      key: 'carbonDioxide',
      label: text.carbonDioxide,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      icon: <Wind size={18} aria-hidden="true" />,
    },
    {
      key: 'water',
      label: text.water,
      min: 0,
      max: 100,
      step: 1,
      unit: '%',
      icon: <Droplets size={18} aria-hidden="true" />,
    },
    {
      key: 'temperature',
      label: text.temperature,
      min: 0,
      max: 45,
      step: 1,
      unit: '°C',
      icon: <Thermometer size={18} aria-hidden="true" />,
    },
    {
      key: 'leafArea',
      label: text.leafArea,
      min: 10,
      max: 100,
      step: 1,
      unit: '%',
      icon: <Leaf size={18} aria-hidden="true" />,
    },
  ]
  const currentHour = inputs.period === 'day' ? 12 : 0

  const updateInput = (key: SliderKey, value: number) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: value,
    }))
  }

  const updatePeriod = (period: MetabolismPeriod) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      period,
    }))
  }

  return (
    <div className="photosynthesis-workspace">
      <aside className="sidebar photosynthesis-sidebar">
        <section className="panel metabolism-controls" aria-labelledby="metabolism-controls-title">
          <div className="panel-heading">
            <p className="eyebrow">
              {localize(text.controlsEyebrow, language)}
            </p>
            <h2 id="metabolism-controls-title">
              {localize(text.controlsTitle, language)}
            </h2>
          </div>

          <div className="period-control">
            <span className="field-label">{localize(text.periodLabel, language)}</span>
            <div className="period-switch" role="group" aria-label={localize(text.periodLabel, language)}>
              <button
                type="button"
                className={`period-button ${inputs.period === 'day' ? 'is-active' : ''}`}
                aria-pressed={inputs.period === 'day'}
                onClick={() => updatePeriod('day')}
              >
                <Sun size={17} aria-hidden="true" />
                <span>{localize(text.day, language)}</span>
              </button>
              <button
                type="button"
                className={`period-button ${inputs.period === 'night' ? 'is-active' : ''}`}
                aria-pressed={inputs.period === 'night'}
                onClick={() => updatePeriod('night')}
              >
                <Moon size={17} aria-hidden="true" />
                <span>{localize(text.night, language)}</span>
              </button>
            </div>
          </div>

          <div className="metabolism-slider-list">
            {sliderConfigs.map((config) => {
              const value = inputs[config.key]
              const fieldId = `metabolism-${config.key}`

              return (
                <label className="metabolism-slider" htmlFor={fieldId} key={config.key}>
                  <span className="slider-label-row">
                    <span className="slider-label">
                      {config.icon}
                      <span>{localize(config.label, language)}</span>
                    </span>
                    <output htmlFor={fieldId}>
                      {value}
                      {config.unit}
                    </output>
                  </span>
                  <input
                    id={fieldId}
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={value}
                    onChange={(event) =>
                      updateInput(config.key, Number(event.currentTarget.value))
                    }
                  />
                </label>
              )
            })}
          </div>

          <div className="effective-light">
            <span>{localize(text.effectiveLight, language)}</span>
            <strong>{rates.effectiveLight.toFixed(0)}%</strong>
          </div>

          <button
            type="button"
            className="control-button reset-metabolism"
            onClick={() => setInputs(initialInputs)}
          >
            <RotateCcw size={18} aria-hidden="true" />
            <span>{localize(text.reset, language)}</span>
          </button>
        </section>

        <section className="panel metabolism-task-panel" aria-labelledby="metabolism-task-title">
          <div className="panel-heading">
            <p className="eyebrow">{localize(text.taskEyebrow, language)}</p>
            <h2 id="metabolism-task-title">
              {localize(text.taskTitle, language)}
            </h2>
          </div>

          <div className="task-selector" role="group" aria-label={localize(text.taskTitle, language)}>
            {tasks.map((task) => (
              <button
                type="button"
                className={`task-button ${activeTaskId === task.id ? 'is-active' : ''}`}
                aria-pressed={activeTaskId === task.id}
                key={task.id}
                onClick={() => setActiveTaskId(task.id)}
              >
                <Target size={16} aria-hidden="true" />
                <span>{localize(task.title, language)}</span>
              </button>
            ))}
          </div>

          <p className="task-prompt">{localize(activeTask.prompt, language)}</p>
          <p
            className={`task-feedback ${taskComplete ? 'is-success' : 'is-pending'}`}
          >
            <FlaskConical size={17} aria-hidden="true" />
            <span>
              <strong>
                {localize(taskComplete ? text.success : text.pending, language)}
              </strong>
              {': '}
              {localize(
                taskComplete ? activeTask.success : activeTask.pending,
                language,
              )}
            </span>
          </p>
        </section>
      </aside>

      <section
        className={`panel metabolism-stage is-${inputs.period}`}
        aria-labelledby="metabolism-stage-title"
      >
        <div className="panel-heading metabolism-stage-heading">
          <div>
            <p className="eyebrow">{localize(text.stageEyebrow, language)}</p>
            <h2 id="metabolism-stage-title">
              {localize(text.stageTitle, language)}
            </h2>
          </div>
          <p className="stage-status">
            {localize(statusLabels[rates.status], language)}
          </p>
        </div>

        <div className="plant-simulation">
          <div className="sky-badge" aria-hidden="true">
            {inputs.period === 'day' ? <Sun size={32} /> : <Moon size={32} />}
          </div>
          <div
            className={`gas gas-co2 ${
              rates.carbonDioxideBalance > 0 ? 'is-outbound' : 'is-inbound'
            }`}
          >
            <span>CO2</span>
            <i />
          </div>
          <div className="plant-model" aria-hidden="true">
            <div className="leaf-shape leaf-left" />
            <div className="leaf-shape leaf-right" />
            <div className="leaf-shape leaf-center" />
            <div className="plant-stem" />
            <div className="plant-soil" />
          </div>
          <div
            className={`gas gas-o2 ${
              rates.oxygenBalance > 0 ? 'is-outbound' : 'is-inbound'
            }`}
          >
            <i />
            <span>O2</span>
          </div>
        </div>

        <p className="process-note">
          {localize(
            inputs.period === 'day' ? text.daytimeNote : text.nighttimeNote,
            language,
          )}
        </p>

        <div className="process-bars" aria-label={localize(text.stageTitle, language)}>
          <div className="process-row">
            <span>
              <Sprout size={17} aria-hidden="true" />
              {localize(text.photosynthesis, language)}
            </span>
            <div className="process-track">
              <div
                className="process-fill is-photosynthesis"
                style={{ width: `${Math.min(rates.photosynthesisRate, 100)}%` }}
              />
            </div>
            <strong>
              {formatRate(rates.photosynthesisRate)}{' '}
              {localize(text.rateUnit, language)}
            </strong>
          </div>
          <div className="process-row">
            <span>
              <Activity size={17} aria-hidden="true" />
              {localize(text.respiration, language)}
            </span>
            <div className="process-track">
              <div
                className="process-fill is-respiration"
                style={{ width: `${Math.min(rates.respirationRate, 100)}%` }}
              />
            </div>
            <strong>
              {formatRate(rates.respirationRate)}{' '}
              {localize(text.rateUnit, language)}
            </strong>
          </div>
        </div>

        <div className="metabolism-metrics">
          <div>
            <span>{localize(text.netOrganicMatter, language)}</span>
            <strong>{formatRate(rates.netOrganicMatter)}</strong>
          </div>
          <div>
            <span>{localize(text.oxygen, language)}</span>
            <strong>
              {formatBalance(
                rates.oxygenBalance,
                localize(text.release, language),
                localize(text.absorb, language),
                localize(text.balanced, language),
              )}
            </strong>
          </div>
          <div>
            <span>{localize(text.carbonDioxideMetric, language)}</span>
            <strong>
              {formatBalance(
                rates.carbonDioxideBalance,
                localize(text.release, language),
                localize(text.absorb, language),
                localize(text.balanced, language),
              )}
            </strong>
          </div>
          <div>
            <span>{localize(text.limitingFactor, language)}</span>
            <strong>{localize(factorLabels[rates.limitingFactor], language)}</strong>
          </div>
        </div>

        <div className="equation-panel">
          <h3>{localize(text.equationTitle, language)}</h3>
          <p>
            <span>{localize(text.photosynthesis, language)}</span>
            <strong>{localize(text.photosynthesisEquation, language)}</strong>
          </p>
          <p>
            <span>{localize(text.respiration, language)}</span>
            <strong>{localize(text.respirationEquation, language)}</strong>
          </p>
        </div>

        <div className="chart-panel">
          <div className="chart-heading">
            <TrendingUp size={18} aria-hidden="true" />
            <h3>{localize(text.chartTitle, language)}</h3>
          </div>
          <RateChart
            points={dayCycle}
            currentHour={currentHour}
            photosynthesisLabel={localize(text.photosynthesis, language)}
            respirationLabel={localize(text.respiration, language)}
          />
        </div>
      </section>
    </div>
  )
}
