import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CloudRain,
  Compass,
  Droplets,
  Globe,
  Pause,
  Play,
  RotateCcw,
  ShipWheel,
  Sun,
  Target,
  ThermometerSun,
  Waves,
} from 'lucide-react'

import { localize, type LocalizedText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { Language } from '../types'
import {
  DEFAULT_GEOGRAPHY_INPUTS,
  calculateGlobalCirculation,
  type AirMotion,
  type ClimateHint,
  type GeographyInputs,
  type GeographySeason,
  type OceanCurrent,
  type PrecipitationTendency,
  type PressureBeltType,
  type WindBeltType,
} from '../utils/geography'
import { EarthCirculationScene } from './EarthCirculationScene'

const text = {
  controlsEyebrow: {
    fr: 'Facteurs',
    zh: '地理因子',
  },
  controlsTitle: {
    fr: 'Saison et forces',
    zh: '季节与动力',
  },
  season: {
    fr: 'Saison',
    zh: '季节',
  },
  coriolis: {
    fr: 'Force de Coriolis',
    zh: '地转偏向力',
  },
  thermalContrast: {
    fr: 'Contraste thermique',
    zh: '热力差异',
  },
  latitude: {
    fr: 'Latitude observée',
    zh: '观察纬度',
  },
  reset: {
    fr: 'Réinitialiser',
    zh: '重置模型',
  },
  play: {
    fr: 'Lecture',
    zh: '播放巡航',
  },
  pause: {
    fr: 'Pause',
    zh: '暂停',
  },
  stageEyebrow: {
    fr: 'Géographie physique',
    zh: '自然地理',
  },
  stageTitle: {
    fr: 'Circulation atmosphérique et courants océaniques',
    zh: '大气环流与洋流联动',
  },
  solarDeclination: {
    fr: 'Déclinaison solaire',
    zh: '太阳直射纬度',
  },
  beltShift: {
    fr: 'Déplacement des ceintures',
    zh: '气压带移动',
  },
  windSpeed: {
    fr: 'Vent relatif',
    zh: '相对风速',
  },
  globalSection: {
    fr: 'Ceintures de pression et vents planétaires',
    zh: '气压带与全球风带',
  },
  oceanSection: {
    fr: 'Courants océaniques simplifiés',
    zh: '简化洋流环流',
  },
  inspectorSection: {
    fr: 'Diagnostic de latitude',
    zh: '纬度诊断',
  },
  pressure: {
    fr: 'Ceinture de pression',
    zh: '气压带',
  },
  wind: {
    fr: 'Vent dominant',
    zh: '盛行风',
  },
  precipitation: {
    fr: 'Pluie probable',
    zh: '降水倾向',
  },
  climate: {
    fr: 'Climat probable',
    zh: '气候倾向',
  },
  airMotion: {
    fr: "Mouvement de l'air",
    zh: '垂直运动',
  },
  currentNote: {
    fr: 'Les vents dominants entraînent les courants de surface; la Coriolis organise les gyres.',
    zh: '盛行风推动表层海水运动，地转偏向力使副热带海区形成大洋环流。',
  },
  latitudeSection: {
    fr: 'Coupe de la latitude choisie',
    zh: '选中纬度剖面',
  },
  upperAir: {
    fr: 'Air en altitude',
    zh: '高空气流',
  },
  surfaceAir: {
    fr: 'Air près du sol',
    zh: '近地面气流',
  },
  moistAscent: {
    fr: 'Air humide ascendant: pluie.',
    zh: '湿润空气上升：易成云雨。',
  },
  drySubsidence: {
    fr: 'Air descendant: sec.',
    zh: '空气下沉增温：少云少雨。',
  },
  localWindTitle: {
    fr: 'Lecture des isobares',
    zh: '等压线风向判读',
  },
  hemisphere: {
    fr: 'Hémisphère',
    zh: '半球',
  },
  level: {
    fr: 'Altitude',
    zh: '风的高度',
  },
  pressureGradient: {
    fr: 'Gradient de pression',
    zh: '气压梯度',
  },
  friction: {
    fr: 'Frottement',
    zh: '摩擦力',
  },
  layout: {
    fr: 'Disposition',
    zh: '气压分布',
  },
  finalWind: {
    fr: 'Vent résultant',
    zh: '实际风向',
  },
  pressureGradientForce: {
    fr: 'Force du gradient',
    zh: '水平气压梯度力',
  },
  geostrophicWind: {
    fr: 'Vent géostrophique',
    zh: '高空地转风',
  },
  crossIsobarAngle: {
    fr: 'Angle avec les isobares',
    zh: '穿越等压线角度',
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
  on: {
    fr: 'Activée',
    zh: '开启',
  },
  off: {
    fr: 'Désactivée',
    zh: '关闭',
  },
}

const seasonLabels: Record<GeographySeason, LocalizedText> = {
  marchEquinox: {
    fr: 'Équinoxe de mars',
    zh: '春分',
  },
  juneSolstice: {
    fr: 'Solstice de juin',
    zh: '夏至',
  },
  septemberEquinox: {
    fr: 'Équinoxe de septembre',
    zh: '秋分',
  },
  decemberSolstice: {
    fr: 'Solstice de décembre',
    zh: '冬至',
  },
}

const pressureLabels: Record<PressureBeltType, LocalizedText> = {
  equatorialLow: {
    fr: 'Basse pression équatoriale',
    zh: '赤道低压带',
  },
  subtropicalHigh: {
    fr: 'Haute pression subtropicale',
    zh: '副热带高压带',
  },
  subpolarLow: {
    fr: 'Basse pression subpolaire',
    zh: '副极地低压带',
  },
  polarHigh: {
    fr: 'Haute pression polaire',
    zh: '极地高压带',
  },
}

const windLabels: Record<WindBeltType, LocalizedText> = {
  trade: {
    fr: 'Alizés',
    zh: '信风带',
  },
  westerly: {
    fr: "Vents d'ouest",
    zh: '西风带',
  },
  polarEasterly: {
    fr: "Vents d'est polaires",
    zh: '极地东风带',
  },
  calm: {
    fr: 'Zone calme',
    zh: '弱风区',
  },
}

const precipitationLabels: Record<PrecipitationTendency, LocalizedText> = {
  wet: {
    fr: 'Humide',
    zh: '多雨',
  },
  dry: {
    fr: 'Sec',
    zh: '少雨',
  },
  seasonal: {
    fr: 'Saisonnier',
    zh: '季节性明显',
  },
  coldDry: {
    fr: 'Froid et sec',
    zh: '寒冷干燥',
  },
}

const climateLabels: Record<ClimateHint, LocalizedText> = {
  rainforest: {
    fr: 'Forêt équatoriale',
    zh: '热带雨林气候',
  },
  savanna: {
    fr: 'Savane',
    zh: '热带草原气候',
  },
  desert: {
    fr: 'Désert',
    zh: '热带沙漠气候',
  },
  mediterranean: {
    fr: 'Méditerranéen',
    zh: '地中海气候',
  },
  temperateMarine: {
    fr: 'Tempéré océanique',
    zh: '温带海洋性气候',
  },
  subpolar: {
    fr: 'Subpolaire',
    zh: '亚寒带湿冷区',
  },
  polar: {
    fr: 'Polaire',
    zh: '极地气候',
  },
}

const airMotionLabels: Record<AirMotion, LocalizedText> = {
  rising: {
    fr: 'Ascendance',
    zh: '上升气流',
  },
  sinking: {
    fr: 'Subsidence',
    zh: '下沉气流',
  },
  converging: {
    fr: 'Convergence',
    zh: '辐合',
  },
  diverging: {
    fr: 'Divergence',
    zh: '辐散',
  },
}

function formatLatitude(latitude: number) {
  const absoluteLatitude = Math.abs(latitude).toFixed(1)

  if (Math.abs(latitude) < 0.1) {
    return '0°'
  }

  return `${absoluteLatitude}°${latitude > 0 ? 'N' : 'S'}`
}

function directionText(degrees: number) {
  const normalizedDegrees = ((degrees % 360) + 360) % 360

  if (normalizedDegrees >= 337.5 || normalizedDegrees < 22.5) return 'E'
  if (normalizedDegrees < 67.5) return 'NE'
  if (normalizedDegrees < 112.5) return 'N'
  if (normalizedDegrees < 157.5) return 'NW'
  if (normalizedDegrees < 202.5) return 'W'
  if (normalizedDegrees < 247.5) return 'SW'
  if (normalizedDegrees < 292.5) return 'S'
  return 'SE'
}

function windNameText(
  type: WindBeltType,
  hemisphere: 'north' | 'south' | 'equator',
  language: Language,
) {
  if (type === 'trade') {
    if (hemisphere === 'north') {
      return language === 'zh'
        ? '东北信风'
        : language === 'fr'
          ? 'Alizé du NE'
          : 'Northeast trade wind'
    }

    return language === 'zh'
      ? '东南信风'
      : language === 'fr'
        ? 'Alizé du SE'
        : 'Southeast trade wind'
  }

  if (type === 'westerly') {
    return language === 'zh'
      ? '盛行西风'
      : language === 'fr'
        ? "Vent d'ouest"
        : 'Westerly wind'
  }

  if (type === 'polarEasterly') {
    return language === 'zh'
      ? '极地东风'
      : language === 'fr'
        ? "Vent d'est polaire"
        : 'Polar easterly'
  }

  return localize(windLabels.calm, language)
}

function explainInspection(
  inputs: GeographyInputs,
  pressureLabel: string,
  precipitationLabel: string,
) {
  if (inputs.selectedLatitude >= 20 && inputs.selectedLatitude <= 40) {
    return {
      en: `${pressureLabel}: air descends and clouds form less readily, so precipitation tends to be ${precipitationLabel.toLowerCase()}.`,
      fr: `${pressureLabel}: l'air descend, les nuages se forment difficilement, donc la tendance est ${precipitationLabel.toLowerCase()}.`,
      zh: `${pressureLabel}控制时以下沉气流为主，水汽不易凝结，所以降水倾向为${precipitationLabel}。`,
    }
  }

  if (Math.abs(inputs.selectedLatitude) <= 12) {
    return {
      en: `${pressureLabel}: warm air converges and rises, favouring convective rainfall.`,
      fr: `${pressureLabel}: l'air chaud converge et monte, ce qui favorise les pluies convectives.`,
      zh: `${pressureLabel}附近受热强、气流辐合上升，容易形成对流雨。`,
    }
  }

  return {
    en: `${pressureLabel} and the prevailing winds determine moisture availability and rainfall distribution.`,
    fr: `${pressureLabel} et les vents dominants déterminent l'humidité disponible et la répartition des pluies.`,
    zh: `${pressureLabel}与盛行风共同决定水汽输送和降水分布。`,
  }
}

function LatitudeSectionDiagram({
  language,
  pressureLabel,
  result,
}: {
  language: Language
  pressureLabel: string
  result: ReturnType<typeof calculateGlobalCirculation>
}) {
  const isRising = result.inspection.airMotion === 'rising'
  const motionLabel = isRising
    ? localize(text.moistAscent, language)
    : localize(text.drySubsidence, language)

  return (
    <svg
      className={`geography-latitude-section-diagram ${isRising ? 'is-rising' : 'is-sinking'}`}
      viewBox="0 0 440 250"
      role="img"
      aria-label={localize(text.latitudeSection, language)}
    >
      <defs>
        <marker
          id="geo-column-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#0f766e" />
        </marker>
      </defs>
      <rect className="geo-column-sky" x="14" y="16" width="412" height="160" rx="12" />
      <rect className="geo-column-ground" x="14" y="176" width="412" height="46" rx="10" />
      <text className="geo-column-layer-label" x="34" y="48">
        {localize(text.upperAir, language)}
      </text>
      <text className="geo-column-layer-label" x="34" y="204">
        {localize(text.surfaceAir, language)}
      </text>

      {isRising ? (
        <g>
          <path className="geo-column-motion" d="M 220 184 C 220 148 220 104 220 66" markerEnd="url(#geo-column-arrow)" />
          <path className="geo-column-cloud" d="M 164 70 C 169 50 197 47 209 62 C 222 45 253 53 255 74 C 273 75 285 87 282 103 C 279 119 266 127 246 127 L 177 127 C 157 127 143 115 143 99 C 143 84 152 74 164 70Z" />
          <path className="geo-column-rain" d="M 174 143 L 166 160 M 202 142 L 194 164 M 232 142 L 224 160 M 260 140 L 252 158" />
          <circle className="geo-column-heat" cx="220" cy="189" r="20" />
        </g>
      ) : (
        <g>
          <path className="geo-column-motion" d="M 220 62 C 220 100 220 142 220 184" markerEnd="url(#geo-column-arrow)" />
          <circle className="geo-column-sun" cx="224" cy="76" r="25" />
          <path className="geo-column-rays" d="M 224 34 L 224 18 M 224 118 L 224 134 M 182 76 L 166 76 M 266 76 L 282 76 M 194 46 L 181 33 M 254 106 L 267 119 M 254 46 L 267 33 M 194 106 L 181 119" />
          <path className="geo-column-dry" d="M 130 190 C 154 174 176 202 202 188 C 229 172 250 202 278 188 C 301 178 315 188 330 180" />
        </g>
      )}

      <g className="geo-column-badge">
        <rect x="296" y="28" width="108" height="54" rx="8" />
        <text x="350" y="50">{formatLatitude(result.inspection.latitude)}</text>
        <text x="350" y="69">{pressureLabel}</text>
      </g>
      <text className="geo-column-motion-label" x="220" y="235">
        {motionLabel}
      </text>
    </svg>
  )
}

function OceanCurrentDiagram({
  currents,
  language,
  isPlaying,
}: {
  currents: OceanCurrent[]
  language: Language
  isPlaying: boolean
}) {
  const strongestCurrent = Math.max(...currents.map((current) => current.strength))

  return (
    <svg
      className={`geography-ocean-diagram ${isPlaying ? 'is-playing' : ''}`}
      viewBox="0 0 760 340"
      role="img"
      aria-label={localize(text.oceanSection, language)}
    >
      <defs>
        <marker
          id="geo-current-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
        </marker>
        <marker
          id="geo-ocean-wind-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#0f766e" />
        </marker>
      </defs>
      <rect className="geo-ocean-water" x="16" y="18" width="728" height="304" rx="10" />
      <path className="geo-continent" d="M84 58 C132 34 180 52 188 104 C198 160 154 194 120 240 C100 266 92 294 66 292 C42 288 36 248 52 210 C72 164 52 106 84 58Z" />
      <path className="geo-continent" d="M366 64 C402 46 464 50 500 78 C534 106 532 150 494 164 C456 180 442 226 406 244 C366 264 330 224 344 184 C360 138 330 92 366 64Z" />
      <path className="geo-continent" d="M578 64 C632 42 690 78 688 134 C684 200 642 232 616 286 C596 310 560 298 570 252 C584 198 548 150 558 108 C562 88 568 74 578 64Z" />

      <path className="geo-current-path" d="M140 98 C238 44 330 76 350 142 C366 214 260 262 152 214 C86 184 82 128 140 98Z" markerEnd="url(#geo-current-arrow)" />
      <text className="geo-current-label" x="142" y="92">
        {language === 'zh' ? '北半球顺时针' : language === 'fr' ? 'Nord: horaire' : 'Northern Hemisphere: clockwise'}
      </text>
      <path className="geo-current-path is-south" d="M154 236 C238 292 332 260 344 204 C356 148 250 120 154 156 C92 180 94 218 154 236Z" markerEnd="url(#geo-current-arrow)" />
      <text className="geo-current-label" x="136" y="278">
        {language === 'zh' ? '南半球逆时针' : language === 'fr' ? 'Sud: antihoraire' : 'Southern Hemisphere: anticlockwise'}
      </text>
      <path className="geo-current-path" d="M458 108 C560 58 646 92 650 154 C656 224 552 260 462 212 C404 180 406 134 458 108Z" markerEnd="url(#geo-current-arrow)" />
      <path className="geo-current-path is-south" d="M462 238 C542 290 646 260 656 208 C666 152 566 122 466 158 C410 180 410 218 462 238Z" markerEnd="url(#geo-current-arrow)" />
      <path className="geo-equatorial-current" d="M96 170 C260 154 466 154 660 170" markerEnd="url(#geo-current-arrow)" />
      <path className="geo-west-wind-drift" d="M82 292 C250 314 504 314 690 292" markerEnd="url(#geo-current-arrow)" />
      <path className="geo-ocean-wind" d="M104 128 C198 110 302 112 392 132" markerEnd="url(#geo-ocean-wind-arrow)" />
      <path className="geo-ocean-wind is-south" d="M668 210 C570 230 466 228 382 206" markerEnd="url(#geo-ocean-wind-arrow)" />
      <text className="geo-ocean-wind-label" x="496" y="38">
        {language === 'zh' ? '风带推动表层海水' : language === 'fr' ? 'Vents de surface' : 'Winds drive surface water'}
      </text>

      <g className="geo-current-strength" transform="translate(28 32)">
        <text x="0" y="0">{localize(text.windSpeed, language)}</text>
        <rect x="0" y="10" width="126" height="8" rx="4" />
        <rect
          className="geo-current-strength-fill"
          x="0"
          y="10"
          width={(currents[0].strength / strongestCurrent) * 126}
          height="8"
          rx="4"
        />
      </g>
    </svg>
  )
}

export function GeographyCirculationLab() {
  const { language } = useLanguage()
  const [inputs, setInputs] = useState<GeographyInputs>(
    DEFAULT_GEOGRAPHY_INPUTS,
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const result = useMemo(() => calculateGlobalCirculation(inputs), [inputs])
  const inspection = result.inspection
  const pressureLabel = localize(
    pressureLabels[inspection.pressureBeltType],
    language,
  )
  const precipitationLabel = localize(
    precipitationLabels[inspection.precipitation],
    language,
  )
  const explanation = explainInspection(inputs, pressureLabel, precipitationLabel)

  useEffect(() => {
    if (!isPlaying) {
      return undefined
    }

    const seasonTour: GeographySeason[] = [
      'marchEquinox',
      'juneSolstice',
      'septemberEquinox',
      'decemberSolstice',
    ]
    const latitudeTour = [-60, -30, 0, 30, 60]

    const timer = window.setInterval(() => {
      setInputs((currentInputs) => {
        const nextSeason =
          seasonTour[
            (seasonTour.indexOf(currentInputs.season) + 1) % seasonTour.length
          ]
        const currentLatitudeIndex = latitudeTour.indexOf(
          Math.round(currentInputs.selectedLatitude),
        )
        const nextLatitude =
          latitudeTour[(currentLatitudeIndex + 1) % latitudeTour.length] ??
          latitudeTour[0]
        const nextThermalContrast =
          currentInputs.thermalContrast >= 92
            ? 52
            : currentInputs.thermalContrast + 8

        return {
          ...currentInputs,
          season: nextSeason,
          selectedLatitude: nextLatitude,
          thermalContrast: nextThermalContrast,
        }
      })
    }, 1400)

    return () => window.clearInterval(timer)
  }, [isPlaying])

  const updateInput = <Key extends keyof GeographyInputs>(
    key: Key,
    value: GeographyInputs[Key],
  ) => {
    setInputs((currentInputs) => ({
      ...currentInputs,
      [key]: value,
    }))
  }

  return (
    <div className="geography-workspace">
      <aside className="sidebar geography-sidebar">
        <section className="panel geography-controls" aria-labelledby="geography-controls-title">
          <div className="panel-heading">
            <p className="eyebrow">{localize(text.controlsEyebrow, language)}</p>
            <h2 id="geography-controls-title">
              {localize(text.controlsTitle, language)}
            </h2>
          </div>

          <div className="geography-season-grid" aria-label={localize(text.season, language)}>
            {(
              [
                'marchEquinox',
                'juneSolstice',
                'septemberEquinox',
                'decemberSolstice',
              ] as GeographySeason[]
            ).map((season) => (
              <button
                className={`geography-chip ${inputs.season === season ? 'is-active' : ''}`}
                key={season}
                type="button"
                onClick={() => updateInput('season', season)}
              >
                <Sun size={16} aria-hidden="true" />
                <span>{localize(seasonLabels[season], language)}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`geography-toggle ${inputs.coriolisEnabled ? 'is-active' : ''}`}
            aria-pressed={inputs.coriolisEnabled}
            onClick={() => updateInput('coriolisEnabled', !inputs.coriolisEnabled)}
          >
            <Compass size={18} aria-hidden="true" />
            <span>{localize(text.coriolis, language)}</span>
            <strong>{localize(inputs.coriolisEnabled ? text.on : text.off, language)}</strong>
          </button>

          <label className="geography-slider" htmlFor="geography-thermal">
            <span className="slider-label-row">
              <span className="slider-label">
                <ThermometerSun size={18} aria-hidden="true" />
                <span>{localize(text.thermalContrast, language)}</span>
              </span>
              <output htmlFor="geography-thermal">{inputs.thermalContrast}%</output>
            </span>
            <input
              id="geography-thermal"
              max="100"
              min="0"
              type="range"
              value={inputs.thermalContrast}
              onChange={(event) =>
                updateInput('thermalContrast', Number(event.currentTarget.value))
              }
            />
          </label>

          <label className="geography-slider" htmlFor="geography-latitude">
            <span className="slider-label-row">
              <span className="slider-label">
                <Target size={18} aria-hidden="true" />
                <span>{localize(text.latitude, language)}</span>
              </span>
              <output htmlFor="geography-latitude">
                {formatLatitude(inputs.selectedLatitude)}
              </output>
            </span>
            <input
              id="geography-latitude"
              max="80"
              min="-80"
              step="1"
              type="range"
              value={inputs.selectedLatitude}
              onChange={(event) =>
                updateInput('selectedLatitude', Number(event.currentTarget.value))
              }
            />
          </label>

          <div className="latitude-presets">
            {[-60, -30, 0, 30, 60].map((latitude) => (
              <button
                key={latitude}
                type="button"
                onClick={() => updateInput('selectedLatitude', latitude)}
              >
                {formatLatitude(latitude)}
              </button>
            ))}
          </div>

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
                setInputs(DEFAULT_GEOGRAPHY_INPUTS)
              }}
            >
              <RotateCcw size={18} aria-hidden="true" />
              <span>{localize(text.reset, language)}</span>
            </button>
          </div>
        </section>
      </aside>

      <section className="panel geography-stage" aria-labelledby="geography-stage-title">
        <div className="panel-heading geography-stage-heading">
          <div>
            <p className="eyebrow">{localize(text.stageEyebrow, language)}</p>
            <h2 id="geography-stage-title">
              {localize(text.stageTitle, language)}
            </h2>
          </div>
          <p className="geography-status">
            {localize(seasonLabels[inputs.season], language)}
          </p>
        </div>

        <div className="geography-metrics">
          <div>
            <span>{localize(text.solarDeclination, language)}</span>
            <strong>{formatLatitude(result.solarDeclination)}</strong>
          </div>
          <div>
            <span>{localize(text.beltShift, language)}</span>
            <strong>{result.seasonalShift > 0 ? '+' : ''}{result.seasonalShift}°</strong>
          </div>
          <div>
            <span>{localize(text.windSpeed, language)}</span>
            <strong>{inspection.windSpeed.toFixed(1)}</strong>
          </div>
        </div>

        <div className="geography-main-grid">
          <section className="geography-earth-hero" aria-labelledby="earth-title">
            <div className="geography-card-heading geography-earth-heading">
              <Globe size={18} aria-hidden="true" />
              <h3 id="earth-title">
                {localize(text.globalSection, language)}
              </h3>
            </div>
            <EarthCirculationScene
              result={result}
              language={language}
              isPlaying={isPlaying}
              onLatitudeSelect={(latitude) =>
                updateInput('selectedLatitude', Math.round(latitude))
              }
            />
            <div className="geography-earth-legend" aria-hidden="true">
              <span className="is-heat">{language === 'zh' ? '热带受热' : language === 'fr' ? 'chauffage' : 'tropical heating'}</span>
              <span className="is-low">{language === 'zh' ? '低压上升' : language === 'fr' ? 'basse pression' : 'rising at low pressure'}</span>
              <span className="is-high">{language === 'zh' ? '高压下沉' : language === 'fr' ? 'haute pression' : 'sinking at high pressure'}</span>
              <span className="is-wind">{language === 'zh' ? '风带流动' : language === 'fr' ? 'vents' : 'wind-belt flow'}</span>
            </div>
          </section>

          <div className="geography-side-stack">
            <section className="geography-card geography-inspector" aria-labelledby="latitude-inspector-title">
              <div className="geography-card-heading">
                <CloudRain size={18} aria-hidden="true" />
                <h3 id="latitude-inspector-title">
                  {localize(text.inspectorSection, language)}
                </h3>
              </div>
              <div className="geography-fact-grid">
                <div>
                  <span>{localize(text.pressure, language)}</span>
                  <strong>{pressureLabel}</strong>
                </div>
                <div>
                  <span>{localize(text.wind, language)}</span>
                  <strong>
                    {windNameText(
                      inspection.windBeltType,
                      inspection.hemisphere,
                      language,
                    )}{' '}
                    ·{' '}
                    {directionText(inspection.windDirectionDegrees)}
                  </strong>
                </div>
                <div>
                  <span>{localize(text.airMotion, language)}</span>
                  <strong>{localize(airMotionLabels[inspection.airMotion], language)}</strong>
                </div>
                <div>
                  <span>{localize(text.precipitation, language)}</span>
                  <strong>{precipitationLabel}</strong>
                </div>
                <div>
                  <span>{localize(text.climate, language)}</span>
                  <strong>{localize(climateLabels[inspection.climateHint], language)}</strong>
                </div>
              </div>
              <p className="geography-explanation">
                {localize(explanation, language)}
              </p>
            </section>

            <section className="geography-card geography-latitude-section" aria-labelledby="latitude-section-title">
              <div className="geography-card-heading">
                <Target size={18} aria-hidden="true" />
                <h3 id="latitude-section-title">
                  {localize(text.latitudeSection, language)}
                </h3>
              </div>
              <LatitudeSectionDiagram
                language={language}
                pressureLabel={pressureLabel}
                result={result}
              />
            </section>
          </div>

        </div>

        <section className="geography-card geography-ocean-card" aria-labelledby="ocean-title">
          <div className="geography-card-heading">
            <Waves size={18} aria-hidden="true" />
            <h3 id="ocean-title">{localize(text.oceanSection, language)}</h3>
          </div>
          <OceanCurrentDiagram
            currents={result.oceanCurrents}
            language={language}
            isPlaying={isPlaying}
          />
          <p className="geography-note">{localize(text.currentNote, language)}</p>
        </section>

        <section className="geography-card geography-causal-chain" aria-label="Geography causal chain">
          <span>{language === 'zh' ? '太阳辐射差异' : language === 'fr' ? 'Rayonnement solaire' : 'Uneven solar radiation'}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>{language === 'zh' ? '气温差异' : language === 'fr' ? 'Température' : 'Temperature differences'}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>{language === 'zh' ? '气压差异' : language === 'fr' ? 'Pression' : 'Pressure differences'}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>{language === 'zh' ? '风带' : language === 'fr' ? 'Vents' : 'Wind belts'}</span>
          <ArrowRight size={16} aria-hidden="true" />
          <span>{language === 'zh' ? '洋流与气候' : language === 'fr' ? 'Courants et climat' : 'Currents and climate'}</span>
          <ShipWheel size={17} aria-hidden="true" />
          <Droplets size={17} aria-hidden="true" />
        </section>
      </section>
    </div>
  )
}
