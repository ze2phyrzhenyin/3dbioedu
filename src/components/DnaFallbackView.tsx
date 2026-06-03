import { baseContent, localize, uiText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { DnaSelection, StepId, ViewOptions } from '../types'
import type { BasePair, DnaBase } from '../utils/dna'

interface DnaFallbackViewProps {
  basePairs: BasePair[]
  selection: DnaSelection | null
  options: ViewOptions
  currentStep: StepId
  emptyMessage: string
  onSelect: (selection: DnaSelection) => void
}

const VIEWBOX_WIDTH = 360
const CENTER_X = VIEWBOX_WIDTH / 2
const STRAND_AMPLITUDE = 96
const ROW_SPACING = 34
const TOP_PADDING = 34
const BASE_WIDTH = 46
const BASE_HEIGHT = 18
const B_DNA_BASE_PAIRS_PER_TURN = 10

function getVisibility(options: ViewOptions, currentStep: StepId) {
  if (currentStep === 1) {
    return {
      showBackbone: true,
      showBases: false,
      showHydrogenBonds: false,
      showLabels: false,
      highlightPairs: false,
    }
  }

  if (currentStep === 2) {
    return {
      showBackbone: true,
      showBases: true,
      showHydrogenBonds: false,
      showLabels: options.showLabels,
      highlightPairs: false,
    }
  }

  if (currentStep === 3) {
    return {
      showBackbone: true,
      showBases: true,
      showHydrogenBonds: true,
      showLabels: options.showLabels,
      highlightPairs: true,
    }
  }

  return {
    showBackbone: options.showBackbone,
    showBases: true,
    showHydrogenBonds: options.showHydrogenBonds,
    showLabels: options.showLabels,
    highlightPairs: options.highlightPairs,
  }
}

function getPoint(index: number, side: 1 | -1) {
  const angle = (index * Math.PI * 2) / B_DNA_BASE_PAIRS_PER_TURN

  return {
    x: CENTER_X + Math.sin(angle) * STRAND_AMPLITUDE * side,
    y: TOP_PADDING + index * ROW_SPACING,
  }
}

function buildPath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join(' ')
}

function BaseLabel({
  base,
  x,
  y,
  isSelected,
  showLabel,
  onClick,
}: {
  base: DnaBase
  x: number
  y: number
  isSelected: boolean
  showLabel: boolean
  onClick: () => void
}) {
  const content = baseContent[base]

  return (
    <g
      role="button"
      tabIndex={0}
      className={`fallback-base ${isSelected ? 'is-selected' : ''}`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
    >
      <rect
        x={x - BASE_WIDTH / 2}
        y={y - BASE_HEIGHT / 2}
        width={BASE_WIDTH}
        height={BASE_HEIGHT}
        rx={4}
        fill={content.color}
      />
      {showLabel ? (
        <text x={x} y={y + 4} textAnchor="middle">
          {base}
        </text>
      ) : null}
    </g>
  )
}

export function DnaFallbackView({
  basePairs,
  selection,
  options,
  currentStep,
  emptyMessage,
  onSelect,
}: DnaFallbackViewProps) {
  const { language } = useLanguage()
  const visibility = getVisibility(options, currentStep)

  if (basePairs.length === 0) {
    return (
      <div className="scene-fallback scene-fallback-empty">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  const viewboxHeight = TOP_PADDING * 2 + (basePairs.length - 1) * ROW_SPACING
  const strandA = basePairs.map((_, index) => getPoint(index, 1))
  const strandB = basePairs.map((_, index) => getPoint(index, -1))

  return (
    <div
      className="scene-fallback"
      aria-label={localize(uiText.scene.fallback2dLabel, language)}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${viewboxHeight}`}
        role="img"
        aria-label={localize(uiText.scene.fallback2dImageLabel, language)}
      >
        {visibility.showBackbone ? (
          <>
            <path
              className="fallback-backbone fallback-backbone-a"
              d={buildPath(strandA)}
            />
            <path
              className="fallback-backbone fallback-backbone-b"
              d={buildPath(strandB)}
            />
          </>
        ) : null}

        {visibility.showBases
          ? basePairs.map((pair, index) => {
              const pointA = strandA[index]
              const pointB = strandB[index]
              const baseASelected =
                selection?.pair.id === pair.id && selection.base === pair.base
              const baseBSelected =
                selection?.pair.id === pair.id &&
                selection.base === pair.complement
              const leftPoint = pointA.x <= pointB.x ? pointA : pointB
              const rightPoint = pointA.x <= pointB.x ? pointB : pointA
              const leftBase = pointA.x <= pointB.x ? pair.base : pair.complement
              const rightBase =
                pointA.x <= pointB.x ? pair.complement : pair.base
              const leftSelected =
                pointA.x <= pointB.x ? baseASelected : baseBSelected
              const rightSelected =
                pointA.x <= pointB.x ? baseBSelected : baseASelected

              return (
                <g key={pair.id}>
                  <line
                    className="fallback-rung"
                    x1={leftPoint.x}
                    y1={leftPoint.y}
                    x2={rightPoint.x}
                    y2={rightPoint.y}
                  />
                  {visibility.showHydrogenBonds ? (
                    <line
                      className={`fallback-hydrogen ${
                        visibility.highlightPairs ? `is-${pair.pairType}` : ''
                      }`}
                      x1={CENTER_X - 18}
                      y1={leftPoint.y}
                      x2={CENTER_X + 18}
                      y2={leftPoint.y}
                    />
                  ) : null}
                  <BaseLabel
                    base={leftBase}
                    x={CENTER_X - 42}
                    y={leftPoint.y}
                    isSelected={leftSelected}
                    showLabel={visibility.showLabels}
                    onClick={() =>
                      onSelect({
                        pair,
                        base: leftBase,
                      })
                    }
                  />
                  <BaseLabel
                    base={rightBase}
                    x={CENTER_X + 42}
                    y={rightPoint.y}
                    isSelected={rightSelected}
                    showLabel={visibility.showLabels}
                    onClick={() =>
                      onSelect({
                        pair,
                        base: rightBase,
                      })
                    }
                  />
                </g>
              )
            })
          : null}
      </svg>
      <p className="scene-fallback-note">
        {localize(uiText.scene.fallback2dNote, language)}
      </p>
    </div>
  )
}
