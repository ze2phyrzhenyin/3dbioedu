import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Compass,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Wind,
} from 'lucide-react'

import { localize, type LocalizedText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { Language } from '../types'
import {
  DEFAULT_LOCAL_WIND_INPUTS,
  calculateLocalWind,
  type Hemisphere,
  type LocalWindInputs,
  type LocalWindLevel,
  type PressureLayout,
} from '../utils/geography'

const text = {
  controlsEyebrow: {
    fr: 'Isobares',
    zh: '等压线',
  },
  controlsTitle: {
    fr: 'Régler la situation',
    zh: '设置判读条件',
  },
  stageEyebrow: {
    fr: 'Vent réel',
    zh: '实际风向',
  },
  stageTitle: {
    fr: 'Lecture dynamique des vents et des isobares',
    zh: '等压线风向动态判读',
  },
  hemisphere: {
    fr: 'Hémisphère',
    zh: '半球',
  },
  level: {
    fr: 'Altitude',
    zh: '风的高度',
  },
  layout: {
    fr: 'Disposition de pression',
    zh: '气压分布',
  },
  pressureGradient: {
    fr: 'Gradient de pression',
    zh: '气压梯度',
  },
  friction: {
    fr: 'Frottement',
    zh: '摩擦力',
  },
  play: {
    fr: 'Lecture',
    zh: '播放演示',
  },
  pause: {
    fr: 'Pause',
    zh: '暂停',
  },
  reset: {
    fr: 'Réinitialiser',
    zh: '重置',
  },
  pressureGradientForce: {
    fr: 'Force du gradient',
    zh: '水平气压梯度力',
  },
  geostrophicWind: {
    fr: 'Vent géostrophique',
    zh: '高空地转风',
  },
  finalWind: {
    fr: 'Vent résultant',
    zh: '实际风向',
  },
  crossIsobarAngle: {
    fr: 'Angle avec les isobares',
    zh: '穿越等压线角',
  },
  speed: {
    fr: 'Vitesse relative',
    zh: '相对风速',
  },
  diagramTitle: {
    fr: 'Forces, isobares et direction du vent',
    zh: '力、等压线与风向',
  },
  ruleTitle: {
    fr: 'Diagnostic',
    zh: '判读结论',
  },
  pressureStep: {
    fr: 'Pression',
    zh: '先看气压',
  },
  hemisphereStep: {
    fr: 'Coriolis',
    zh: '再看半球',
  },
  heightStep: {
    fr: 'Frottement',
    zh: '最后看高度',
  },
  highPressure: {
    fr: 'Haute pression',
    zh: '高压',
  },
  lowPressure: {
    fr: 'Basse pression',
    zh: '低压',
  },
  highToLow: {
    fr: 'H vers B',
    zh: '高压 → 低压',
  },
  north: {
    fr: 'Nord',
    zh: '北半球',
  },
  south: {
    fr: 'Sud',
    zh: '南半球',
  },
  surface: {
    fr: 'Sol',
    zh: '近地面',
  },
  upper: {
    fr: 'Altitude',
    zh: '高空',
  },
  rightDeflection: {
    fr: 'Déviation vers la droite',
    zh: '向右偏',
  },
  leftDeflection: {
    fr: 'Déviation vers la gauche',
    zh: '向左偏',
  },
  surfaceRule: {
    fr: 'Coupe les isobares',
    zh: '斜穿等压线',
  },
  upperRule: {
    fr: 'Parallèle aux isobares',
    zh: '平行等压线',
  },
}

const layoutLabels: Record<PressureLayout, LocalizedText> = {
  highNorthLowSouth: {
    fr: 'H au nord, B au sud',
    zh: '北高南低',
  },
  lowNorthHighSouth: {
    fr: 'B au nord, H au sud',
    zh: '北低南高',
  },
  highWestLowEast: {
    fr: "H à l'ouest, B à l'est",
    zh: '西高东低',
  },
  lowWestHighEast: {
    fr: "B à l'ouest, H à l'est",
    zh: '西低东高',
  },
}

const hemisphereLabels: Record<Hemisphere, LocalizedText> = {
  north: text.north,
  south: text.south,
}

const levelLabels: Record<LocalWindLevel, LocalizedText> = {
  surface: text.surface,
  upper: text.upper,
}

const pressureLayouts: PressureLayout[] = [
  'highNorthLowSouth',
  'lowNorthHighSouth',
  'highWestLowEast',
  'lowWestHighEast',
]

const demoFrames: LocalWindInputs[] = [
  {
    hemisphere: 'north',
    level: 'surface',
    pressureGradient: 68,
    friction: 46,
    pressureLayout: 'highNorthLowSouth',
  },
  {
    hemisphere: 'north',
    level: 'upper',
    pressureGradient: 82,
    friction: 12,
    pressureLayout: 'highWestLowEast',
  },
  {
    hemisphere: 'south',
    level: 'surface',
    pressureGradient: 74,
    friction: 54,
    pressureLayout: 'lowNorthHighSouth',
  },
  {
    hemisphere: 'south',
    level: 'upper',
    pressureGradient: 58,
    friction: 18,
    pressureLayout: 'lowWestHighEast',
  },
]

function directionVector(degrees: number, length: number) {
  const radians = (degrees * Math.PI) / 180

  return {
    x: Math.cos(radians) * length,
    y: -Math.sin(radians) * length,
  }
}

function directionText(degrees: number, language: Language) {
  const normalizedDegrees = ((degrees % 360) + 360) % 360
  const labels = language === 'zh'
    ? ['向东', '向东北', '向北', '向西北', '向西', '向西南', '向南', '向东南']
    : language === 'fr'
      ? ['E', 'NE', 'N', 'NO', 'O', 'SO', 'S', 'SE']
      : ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']

  if (normalizedDegrees >= 337.5 || normalizedDegrees < 22.5) return labels[0]
  if (normalizedDegrees < 67.5) return labels[1]
  if (normalizedDegrees < 112.5) return labels[2]
  if (normalizedDegrees < 157.5) return labels[3]
  if (normalizedDegrees < 202.5) return labels[4]
  if (normalizedDegrees < 247.5) return labels[5]
  if (normalizedDegrees < 292.5) return labels[6]
  return labels[7]
}

function isNorthSouthLayout(layout: PressureLayout) {
  return layout === 'highNorthLowSouth' || layout === 'lowNorthHighSouth'
}

function isHighFirst(layout: PressureLayout) {
  return layout === 'highNorthLowSouth' || layout === 'highWestLowEast'
}

function getPressurePositions(layout: PressureLayout) {
  if (layout === 'highNorthLowSouth') {
    return {
      high: { x: 260, y: 48 },
      low: { x: 260, y: 264 },
    }
  }

  if (layout === 'lowNorthHighSouth') {
    return {
      high: { x: 260, y: 264 },
      low: { x: 260, y: 48 },
    }
  }

  if (layout === 'highWestLowEast') {
    return {
      high: { x: 76, y: 154 },
      low: { x: 446, y: 154 },
    }
  }

  return {
    high: { x: 446, y: 154 },
    low: { x: 76, y: 154 },
  }
}

function pressurePathText(layout: PressureLayout, language: Language) {
  const pressurePath: Record<PressureLayout, LocalizedText> = {
    highNorthLowSouth: {
      en: 'High to the north → low to the south',
      fr: 'Nord haut → sud bas',
      zh: '北侧高压 → 南侧低压',
    },
    lowNorthHighSouth: {
      en: 'High to the south → low to the north',
      fr: 'Sud haut → nord bas',
      zh: '南侧高压 → 北侧低压',
    },
    highWestLowEast: {
      en: 'High to the west → low to the east',
      fr: 'Ouest haut → est bas',
      zh: '西侧高压 → 东侧低压',
    },
    lowWestHighEast: {
      en: 'High to the east → low to the west',
      fr: 'Est haut → ouest bas',
      zh: '东侧高压 → 西侧低压',
    },
  }

  return localize(pressurePath[layout], language)
}

function windExplanation(
  inputs: LocalWindInputs,
  result: ReturnType<typeof calculateLocalWind>,
  language: Language,
) {
  const deflection =
    inputs.hemisphere === 'north'
      ? localize(text.rightDeflection, language)
      : localize(text.leftDeflection, language)
  const isobarRule = result.isParallelToIsobars
    ? localize(text.upperRule, language)
    : localize(text.surfaceRule, language)

  if (language === 'zh') {
    return `${pressurePathText(inputs.pressureLayout, language)}，水平气压梯度力先指向低压；${localize(hemisphereLabels[inputs.hemisphere], language)}受地转偏向力影响${deflection}；${localize(levelLabels[inputs.level], language)}风会${isobarRule}，最终风向为${directionText(result.finalWindDegrees, language)}。`
  }

  if (language === 'en') {
    return `${pressurePathText(inputs.pressureLayout, language)}: the pressure-gradient force points towards low pressure; in the ${localize(hemisphereLabels[inputs.hemisphere], language).toLowerCase()}, Coriolis causes ${deflection.toLowerCase()}; at ${localize(levelLabels[inputs.level], language).toLowerCase()}, the wind ${isobarRule.toLowerCase()}.`
  }

  return `${pressurePathText(inputs.pressureLayout, language)}: la force du gradient pointe d'abord vers la basse pression; dans l'hémisphère ${localize(hemisphereLabels[inputs.hemisphere], language).toLowerCase()}, le vent subit une ${deflection.toLowerCase()}; au niveau ${localize(levelLabels[inputs.level], language).toLowerCase()}, le vent devient ${isobarRule.toLowerCase()}.`
}

function LocalWindDiagram({
  inputs,
  result,
  language,
  isPlaying,
}: {
  inputs: LocalWindInputs
  result: ReturnType<typeof calculateLocalWind>
  language: Language
  isPlaying: boolean
}) {
  const pgf = directionVector(result.pressureGradientForceDegrees, 78)
  const finalWind = directionVector(result.finalWindDegrees, 112)
  const geoWind = directionVector(result.geostrophicWindDegrees, 88)
  const pressurePositions = getPressurePositions(inputs.pressureLayout)
  const horizontal = isNorthSouthLayout(inputs.pressureLayout)
  const highFirst = isHighFirst(inputs.pressureLayout)
  const isobarLines = [0, 1, 2, 3]

  return (
    <svg
      className={`local-wind-diagram wind-reading-diagram ${isPlaying ? 'is-playing' : ''}`}
      viewBox="0 0 520 310"
      role="img"
      aria-label={localize(text.diagramTitle, language)}
    >
      <defs>
        <marker
          id="wind-force-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
        </marker>
        <marker
          id="wind-final-arrow"
          markerHeight="9"
          markerWidth="9"
          orient="auto"
          refX="8"
          refY="4.5"
        >
          <path d="M0,0 L9,4.5 L0,9 Z" fill="#0f766e" />
        </marker>
        <marker
          id="wind-geo-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#f59e0b" />
        </marker>
      </defs>

      {horizontal
        ? isobarLines.map((lineIndex) => {
            const y = 76 + lineIndex * 46
            const pressure = highFirst ? 1020 - lineIndex * 4 : 1008 + lineIndex * 4

            return (
              <g key={y}>
                <path className="local-isobar" d={`M 64 ${y} C 176 ${y - 22}, 336 ${y + 22}, 456 ${y}`} />
                <text className="local-isobar-label" x="72" y={y - 10}>
                  {pressure}
                </text>
              </g>
            )
          })
        : isobarLines.map((lineIndex) => {
            const x = 98 + lineIndex * 108
            const pressure = highFirst ? 1020 - lineIndex * 4 : 1008 + lineIndex * 4

            return (
              <g key={x}>
                <path className="local-isobar" d={`M ${x} 48 C ${x - 22} 120, ${x + 22} 188, ${x} 262`} />
                <text className="local-isobar-label" x={x + 8} y="68">
                  {pressure}
                </text>
              </g>
            )
          })}

      <text
        className="local-pressure-label is-high"
        x={pressurePositions.high.x}
        y={pressurePositions.high.y}
      >
        H
      </text>
      <text
        className="local-pressure-word is-high"
        x={pressurePositions.high.x}
        y={pressurePositions.high.y + 22}
      >
        {localize(text.highPressure, language)}
      </text>
      <text
        className="local-pressure-label is-low"
        x={pressurePositions.low.x}
        y={pressurePositions.low.y}
      >
        {language === 'fr' ? 'B' : 'L'}
      </text>
      <text
        className="local-pressure-word is-low"
        x={pressurePositions.low.x}
        y={pressurePositions.low.y + 22}
      >
        {localize(text.lowPressure, language)}
      </text>

      <circle className="local-wind-origin" cx="260" cy="154" r="7" />
      <line
        className="local-pgf-arrow"
        markerEnd="url(#wind-force-arrow)"
        x1="260"
        x2={260 + pgf.x}
        y1="154"
        y2={154 + pgf.y}
      />
      <line
        className="local-geo-arrow"
        markerEnd="url(#wind-geo-arrow)"
        x1="260"
        x2={260 + geoWind.x}
        y1="154"
        y2={154 + geoWind.y}
      />
      <line
        className="local-final-arrow"
        markerEnd="url(#wind-final-arrow)"
        x1="260"
        x2={260 + finalWind.x}
        y1="154"
        y2={154 + finalWind.y}
      />
      <circle
        className="wind-flow-dot"
        cx={260 + finalWind.x * 0.42}
        cy={154 + finalWind.y * 0.42}
        r="4"
      />
      <circle
        className="wind-flow-dot is-late"
        cx={260 + finalWind.x * 0.72}
        cy={154 + finalWind.y * 0.72}
        r="3.5"
      />
      <text className="local-wind-tag is-pgf" x={270 + pgf.x} y={154 + pgf.y}>
        {language === 'zh' ? '梯度力' : 'Gradient'}
      </text>
      <text className="local-wind-tag is-geo" x={270 + geoWind.x} y={154 + geoWind.y}>
        {language === 'zh' ? '高空风' : language === 'fr' ? 'Géostrophique' : 'Geostrophic wind'}
      </text>
      <text className="local-wind-tag is-final" x={270 + finalWind.x} y={154 + finalWind.y}>
        {language === 'zh' ? '实际风' : language === 'fr' ? 'Vent réel' : 'Actual wind'}
      </text>
    </svg>
  )
}

export function WindReadingLab() {
  const { language } = useLanguage()
  const [inputs, setInputs] = useState<LocalWindInputs>(
    DEFAULT_LOCAL_WIND_INPUTS,
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [, setDemoIndex] = useState(0)
  const result = useMemo(() => calculateLocalWind(inputs), [inputs])

  useEffect(() => {
    if (!isPlaying) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setDemoIndex((currentIndex) => {
        const nextIndex = (currentIndex + 1) % demoFrames.length
        setInputs(demoFrames[nextIndex])

        return nextIndex
      })
    }, 1350)

    return () => window.clearInterval(timer)
  }, [isPlaying])

  const updateInput = <Key extends keyof LocalWindInputs>(
    key: Key,
    value: LocalWindInputs[Key],
  ) => {
    setIsPlaying(false)
    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: value,
    }))
  }

  return (
    <div className="geography-workspace wind-reading-workspace">
      <aside className="sidebar geography-sidebar wind-reading-sidebar">
        <section className="panel geography-controls wind-reading-controls" aria-labelledby="wind-reading-controls-title">
          <div className="panel-heading">
            <p className="eyebrow">{localize(text.controlsEyebrow, language)}</p>
            <h2 id="wind-reading-controls-title">
              {localize(text.controlsTitle, language)}
            </h2>
          </div>

          <div className="wind-control-group">
            <span>{localize(text.hemisphere, language)}</span>
            <div className="local-wind-switches">
              {(['north', 'south'] as Hemisphere[]).map((hemisphere) => (
                <button
                  className={`geography-chip ${inputs.hemisphere === hemisphere ? 'is-active' : ''}`}
                  key={hemisphere}
                  type="button"
                  onClick={() => updateInput('hemisphere', hemisphere)}
                >
                  <Compass size={16} aria-hidden="true" />
                  <span>{localize(hemisphereLabels[hemisphere], language)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="wind-control-group">
            <span>{localize(text.level, language)}</span>
            <div className="local-wind-switches">
              {(['surface', 'upper'] as LocalWindLevel[]).map((level) => (
                <button
                  className={`geography-chip ${inputs.level === level ? 'is-active' : ''}`}
                  key={level}
                  type="button"
                  onClick={() => updateInput('level', level)}
                >
                  <Wind size={16} aria-hidden="true" />
                  <span>{localize(levelLabels[level], language)}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="geography-field" htmlFor="wind-pressure-layout">
            <span>{localize(text.layout, language)}</span>
            <select
              id="wind-pressure-layout"
              value={inputs.pressureLayout}
              onChange={(event) =>
                updateInput(
                  'pressureLayout',
                  event.currentTarget.value as PressureLayout,
                )
              }
            >
              {pressureLayouts.map((layout) => (
                <option key={layout} value={layout}>
                  {localize(layoutLabels[layout], language)}
                </option>
              ))}
            </select>
          </label>

          <label className="geography-slider" htmlFor="wind-pressure-gradient">
            <span className="slider-label-row">
              <span className="slider-label">
                <Gauge size={18} aria-hidden="true" />
                <span>{localize(text.pressureGradient, language)}</span>
              </span>
              <output htmlFor="wind-pressure-gradient">
                {inputs.pressureGradient}%
              </output>
            </span>
            <input
              id="wind-pressure-gradient"
              max="100"
              min="0"
              type="range"
              value={inputs.pressureGradient}
              onChange={(event) =>
                updateInput(
                  'pressureGradient',
                  Number(event.currentTarget.value),
                )
              }
            />
          </label>

          <label className="geography-slider" htmlFor="wind-surface-friction">
            <span className="slider-label-row">
              <span className="slider-label">
                <Activity size={18} aria-hidden="true" />
                <span>{localize(text.friction, language)}</span>
              </span>
              <output htmlFor="wind-surface-friction">{inputs.friction}%</output>
            </span>
            <input
              id="wind-surface-friction"
              max="100"
              min="0"
              type="range"
              value={inputs.friction}
              onChange={(event) =>
                updateInput('friction', Number(event.currentTarget.value))
              }
            />
          </label>

          <div className="geography-action-row">
            <button
              type="button"
              className={`control-button geography-play-button ${isPlaying ? 'is-playing' : ''}`}
              aria-pressed={isPlaying}
              onClick={() => setIsPlaying((currentValue) => !currentValue)}
            >
              {isPlaying ? (
                <Pause size={18} aria-hidden="true" />
              ) : (
                <Play size={18} aria-hidden="true" />
              )}
              <span>{localize(isPlaying ? text.pause : text.play, language)}</span>
            </button>
            <button
              type="button"
              className="control-button geography-reset"
              onClick={() => {
                setIsPlaying(false)
                setDemoIndex(0)
                setInputs(DEFAULT_LOCAL_WIND_INPUTS)
              }}
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span>{localize(text.reset, language)}</span>
            </button>
          </div>
        </section>
      </aside>

      <section className="panel geography-stage wind-reading-stage" aria-labelledby="wind-reading-stage-title">
        <div className="panel-heading geography-stage-heading">
          <div>
            <p className="eyebrow">{localize(text.stageEyebrow, language)}</p>
            <h2 id="wind-reading-stage-title">
              {localize(text.stageTitle, language)}
            </h2>
          </div>
          <p className="geography-status">
            {localize(hemisphereLabels[inputs.hemisphere], language)} ·{' '}
            {localize(levelLabels[inputs.level], language)}
          </p>
        </div>

        <div className="geography-metrics wind-reading-metrics">
          <div>
            <span>{localize(text.pressureGradientForce, language)}</span>
            <strong>{directionText(result.pressureGradientForceDegrees, language)}</strong>
          </div>
          <div>
            <span>{localize(text.geostrophicWind, language)}</span>
            <strong>{directionText(result.geostrophicWindDegrees, language)}</strong>
          </div>
          <div>
            <span>{localize(text.finalWind, language)}</span>
            <strong>{directionText(result.finalWindDegrees, language)}</strong>
          </div>
          <div>
            <span>{localize(text.crossIsobarAngle, language)}</span>
            <strong>{result.crossIsobarAngle}°</strong>
          </div>
          <div>
            <span>{localize(text.speed, language)}</span>
            <strong>{result.speed.toFixed(1)}</strong>
          </div>
        </div>

        <div className="wind-reading-main-grid">
          <section className="geography-card wind-diagram-card" aria-labelledby="wind-diagram-title">
            <div className="geography-card-heading">
              <Wind size={18} aria-hidden="true" />
              <h3 id="wind-diagram-title">
                {localize(text.diagramTitle, language)}
              </h3>
            </div>
            <LocalWindDiagram
              inputs={inputs}
              result={result}
              language={language}
              isPlaying={isPlaying}
            />
            <div className="wind-force-legend" aria-label={localize(text.diagramTitle, language)}>
              <span><i className="is-pgf" />{localize(text.pressureGradientForce, language)}</span>
              <span><i className="is-geo" />{localize(text.geostrophicWind, language)}</span>
              <span><i className="is-final" />{localize(text.finalWind, language)}</span>
            </div>
          </section>

          <section className="geography-card wind-rule-card" aria-labelledby="wind-rule-title">
            <div className="geography-card-heading">
              <Compass size={18} aria-hidden="true" />
              <h3 id="wind-rule-title">{localize(text.ruleTitle, language)}</h3>
            </div>
            <div className="wind-rule-grid">
              <div>
                <span>1</span>
                <strong>{localize(text.pressureStep, language)}</strong>
                <p>{pressurePathText(inputs.pressureLayout, language)}</p>
              </div>
              <div>
                <span>2</span>
                <strong>{localize(text.hemisphereStep, language)}</strong>
                <p>
                  {inputs.hemisphere === 'north'
                    ? localize(text.rightDeflection, language)
                    : localize(text.leftDeflection, language)}
                </p>
              </div>
              <div>
                <span>3</span>
                <strong>{localize(text.heightStep, language)}</strong>
                <p>
                  {result.isParallelToIsobars
                    ? localize(text.upperRule, language)
                    : localize(text.surfaceRule, language)}
                </p>
              </div>
            </div>
            <p className="geography-explanation">
              {windExplanation(inputs, result, language)}
            </p>
          </section>
        </div>

        <section className="geography-card geography-causal-chain wind-reading-chain" aria-label="Wind reading causal chain">
          <span>{localize(text.highPressure, language)}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>{localize(text.highToLow, language)}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>
            {inputs.hemisphere === 'north'
              ? localize(text.rightDeflection, language)
              : localize(text.leftDeflection, language)}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>
            {result.isParallelToIsobars
              ? localize(text.upperRule, language)
              : localize(text.surfaceRule, language)}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>{directionText(result.finalWindDegrees, language)}</span>
        </section>
      </section>
    </div>
  )
}
