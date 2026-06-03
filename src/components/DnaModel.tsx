import { Billboard, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

import { baseContent, pairContent } from '../data/scienceContent'
import type { DnaSelection, StepId, ViewOptions } from '../types'
import type { BasePair, DnaBase } from '../utils/dna'

interface DnaModelProps {
  basePairs: BasePair[]
  selection: DnaSelection | null
  options: ViewOptions
  currentStep: StepId
  emptyMessage?: string
  onSelect: (selection: DnaSelection) => void
}

interface CylinderBetweenProps {
  start: THREE.Vector3
  end: THREE.Vector3
  radius: number
  color: string
  opacity?: number
  onClick?: (event: ThreeEvent<MouseEvent>) => void
}

interface PairGeometry {
  pair: BasePair
  tangent: THREE.Vector3
  backboneA: THREE.Vector3
  backboneB: THREE.Vector3
  baseAOuter: THREE.Vector3
  baseAInner: THREE.Vector3
  baseBOuter: THREE.Vector3
  baseBInner: THREE.Vector3
  labelA: THREE.Vector3
  labelB: THREE.Vector3
}

interface EffectiveVisibility {
  showBackbone: boolean
  showBases: boolean
  showHydrogenBonds: boolean
  showLabels: boolean
  highlightPairs: boolean
}

const BASE_PAIR_SPACING = 0.34
const B_DNA_BASE_PAIRS_PER_TURN = 10
const TWIST_PER_BASE = (Math.PI * 2) / B_DNA_BASE_PAIRS_PER_TURN
const HELIX_RADIUS = 1
const BASE_OUTER_RADIUS = 0.74
const BASE_INNER_RADIUS = 0.18
const SPLIT_DISTANCE = 0.46
const RIBBON_WIDTH = 0.34

function pointOnRadius(
  direction: THREE.Vector3,
  radius: number,
  yPosition: number,
  offset: THREE.Vector3,
) {
  const point = direction.clone().multiplyScalar(radius)
  point.y = yPosition
  return point.add(offset)
}

function getEffectiveVisibility(
  options: ViewOptions,
  currentStep: StepId,
): EffectiveVisibility {
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

function getCylinderTransform(start: THREE.Vector3, end: THREE.Vector3) {
  const direction = end.clone().sub(start)
  const length = direction.length()
  const midpoint = start.clone().add(end).multiplyScalar(0.5)
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize(),
  )

  return { midpoint, quaternion, length }
}

function CylinderBetween({
  start,
  end,
  radius,
  color,
  opacity = 1,
  onClick,
}: CylinderBetweenProps) {
  const { midpoint, quaternion, length } = useMemo(
    () => getCylinderTransform(start, end),
    [start, end],
  )

  return (
    <mesh
      position={midpoint}
      quaternion={quaternion}
      castShadow
      receiveShadow
      onClick={onClick}
    >
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial
        color={color}
        roughness={0.62}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

function getRibbonPoints(points: THREE.Vector3[]) {
  if (points.length !== 1) {
    return points
  }

  const point = points[0]

  return [
    point.clone().add(new THREE.Vector3(0, -BASE_PAIR_SPACING * 0.7, 0)),
    point.clone().add(new THREE.Vector3(0, BASE_PAIR_SPACING * 0.7, 0)),
  ]
}

function createRibbonGeometry(points: THREE.Vector3[], width: number) {
  const positions: number[] = []
  const indices: number[] = []

  points.forEach((point) => {
    const radial = new THREE.Vector3(point.x, 0, point.z)

    if (radial.lengthSq() < 0.001) {
      radial.set(1, 0, 0)
    }

    radial.normalize()

    const outer = point.clone().add(radial.clone().multiplyScalar(width / 2))
    const inner = point.clone().add(radial.clone().multiplyScalar(-width / 2))

    positions.push(outer.x, outer.y, outer.z, inner.x, inner.y, inner.z)
  })

  for (let index = 0; index < points.length - 1; index += 1) {
    const a = index * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3

    indices.push(a, c, b, b, c, d)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

function RibbonBackbone({
  points,
  color,
  edgeColor,
}: {
  points: THREE.Vector3[]
  color: string
  edgeColor: string
}) {
  const ribbonPoints = useMemo(() => getRibbonPoints(points), [points])
  const geometry = useMemo(
    () => createRibbonGeometry(ribbonPoints, RIBBON_WIDTH),
    [ribbonPoints],
  )
  const edgePoints = useMemo(() => {
    return ribbonPoints.map((point) => {
      const radial = new THREE.Vector3(point.x, 0, point.z)

      if (radial.lengthSq() < 0.001) {
        radial.set(1, 0, 0)
      }

      radial.normalize()

      return {
        outer: point.clone().add(radial.clone().multiplyScalar(RIBBON_WIDTH / 2)),
        inner: point.clone().add(radial.clone().multiplyScalar(-RIBBON_WIDTH / 2)),
      }
    })
  }, [ribbonPoints])

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.78}
          metalness={0.02}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {edgePoints.slice(1).map((point, pointIndex) => (
        <group key={`ribbon-edge-${pointIndex}`}>
          <CylinderBetween
            start={edgePoints[pointIndex].outer}
            end={point.outer}
            radius={0.01}
            color={edgeColor}
            opacity={0.7}
          />
          <CylinderBetween
            start={edgePoints[pointIndex].inner}
            end={point.inner}
            radius={0.008}
            color={edgeColor}
            opacity={0.45}
          />
        </group>
      ))}
    </group>
  )
}

function BaseBlock({
  pair,
  base,
  start,
  end,
  labelPosition,
  showLabel,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: {
  pair: BasePair
  base: DnaBase
  start: THREE.Vector3
  end: THREE.Vector3
  labelPosition: THREE.Vector3
  showLabel: boolean
  isSelected: boolean
  isHovered: boolean
  onSelect: (selection: DnaSelection) => void
  onHover: () => void
  onLeave: () => void
}) {
  const content = baseContent[base]
  const isHighlighted = isSelected || isHovered
  const { midpoint, quaternion, length } = useMemo(() => {
    const direction = end.clone().sub(start)
    const nextLength = direction.length()
    const nextMidpoint = start.clone().add(end).multiplyScalar(0.5)
    const nextQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(1, 0, 0),
      direction.clone().normalize(),
    )

    return {
      midpoint: nextMidpoint,
      quaternion: nextQuaternion,
      length: nextLength,
    }
  }, [start, end])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect({ pair, base })
  }

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onHover()
  }

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onLeave()
  }

  return (
    <group>
      <mesh
        position={midpoint}
        quaternion={quaternion}
        castShadow
        receiveShadow
        scale={isHighlighted ? 1.08 : 1}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[length, 0.16, 0.11]} />
        <meshStandardMaterial
          color={content.color}
          roughness={0.54}
          emissive={content.color}
          emissiveIntensity={isHighlighted ? 0.32 : 0.03}
        />
      </mesh>

      {showLabel ? (
        <Billboard position={labelPosition}>
          <Text
            fontSize={0.18}
            color="#111827"
            anchorX="center"
            anchorY="middle"
            outlineColor="#ffffff"
            outlineWidth={0.02}
            onClick={handleClick}
          >
            {base}
          </Text>
        </Billboard>
      ) : null}
    </group>
  )
}

function DottedHydrogenBonds({
  geometry,
  highlightPairs,
  onSelect,
}: {
  geometry: PairGeometry
  highlightPairs: boolean
  onSelect: (selection: DnaSelection) => void
}) {
  const pairTypeContent = pairContent[geometry.pair.pairType]
  const dotColor = highlightPairs ? pairTypeContent.accentColor : '#111827'
  const dotCount = 5

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect({ pair: geometry.pair, base: geometry.pair.base })
  }

  return (
    <group>
      {Array.from(
        { length: pairTypeContent.hydrogenBondCount },
        (_, bondIndex) => {
          const rowOffsetAmount =
            (bondIndex - (pairTypeContent.hydrogenBondCount - 1) / 2) * 0.075
          const rowOffset = geometry.tangent
            .clone()
            .multiplyScalar(rowOffsetAmount)

          return (
            <group key={`hydrogen-row-${geometry.pair.id}-${bondIndex}`}>
              {Array.from({ length: dotCount }, (_, dotIndex) => {
                const progress = (dotIndex + 1) / (dotCount + 1)
                const position = geometry.baseAInner
                  .clone()
                  .lerp(geometry.baseBInner, progress)
                  .add(rowOffset)

                return (
                  <mesh
                    key={`hydrogen-dot-${geometry.pair.id}-${bondIndex}-${dotIndex}`}
                    position={position}
                    castShadow
                    receiveShadow
                    onClick={handleClick}
                  >
                    <sphereGeometry
                      args={[highlightPairs ? 0.025 : 0.019, 10, 10]}
                    />
                    <meshStandardMaterial
                      color={dotColor}
                      roughness={0.45}
                      emissive={highlightPairs ? dotColor : '#000000'}
                      emissiveIntensity={highlightPairs ? 0.18 : 0}
                    />
                  </mesh>
                )
              })}
            </group>
          )
        },
      )}
    </group>
  )
}

export function DnaModel({
  basePairs,
  selection,
  options,
  currentStep,
  emptyMessage = 'Saisir une séquence A/T/C/G',
  onSelect,
}: DnaModelProps) {
  const [splitProgress, setSplitProgress] = useState(options.splitOpen ? 1 : 0)
  const [hoveredBase, setHoveredBase] = useState<{
    pairId: string
    base: DnaBase
  } | null>(null)

  useFrame((_, delta) => {
    setSplitProgress((currentProgress) => {
      const targetProgress = options.splitOpen ? 1 : 0

      if (currentProgress === targetProgress) {
        return currentProgress
      }

      const nextProgress = THREE.MathUtils.damp(
        currentProgress,
        targetProgress,
        5,
        delta,
      )

      return Math.abs(nextProgress - targetProgress) < 0.001
        ? targetProgress
        : nextProgress
    })
  })

  useEffect(() => {
    document.body.style.cursor = hoveredBase ? 'pointer' : ''

    return () => {
      document.body.style.cursor = ''
    }
  }, [hoveredBase])

  const effectiveVisibility = getEffectiveVisibility(options, currentStep)
  const modelScale =
    basePairs.length <= 2
      ? 1.85
      : basePairs.length <= 5
        ? 1.42
        : basePairs.length <= 12
          ? 1.08
          : 0.92

  const modelParams = useMemo(() => {
    const basePairCount = basePairs.length
    const helixHeight = Math.max(
      BASE_PAIR_SPACING,
      (basePairCount - 1) * BASE_PAIR_SPACING,
    )

    return {
      basePairCount,
      helixRadius: HELIX_RADIUS,
      helixHeight,
      twistPerBase: TWIST_PER_BASE,
      strandSeparation: HELIX_RADIUS * 2,
      splitAnimationProgress: splitProgress,
    }
  }, [basePairs.length, splitProgress])

  const pairGeometry = useMemo<PairGeometry[]>(() => {
    const centerIndex = (modelParams.basePairCount - 1) / 2

    return basePairs.map((pair, pairIndex) => {
      const angle = pairIndex * modelParams.twistPerBase
      const yPosition = (pairIndex - centerIndex) * BASE_PAIR_SPACING
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
      const oppositeRadial = radial.clone().multiplyScalar(-1)
      const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle))
      const splitA = radial
        .clone()
        .multiplyScalar(SPLIT_DISTANCE * modelParams.splitAnimationProgress)
      const splitB = radial
        .clone()
        .multiplyScalar(-SPLIT_DISTANCE * modelParams.splitAnimationProgress)

      const backboneA = pointOnRadius(
        radial,
        modelParams.helixRadius,
        yPosition,
        splitA,
      )
      const backboneB = pointOnRadius(
        oppositeRadial,
        modelParams.helixRadius,
        yPosition,
        splitB,
      )
      const baseAOuter = pointOnRadius(
        radial,
        BASE_OUTER_RADIUS,
        yPosition,
        splitA,
      )
      const baseAInner = pointOnRadius(
        radial,
        BASE_INNER_RADIUS,
        yPosition,
        splitA,
      )
      const baseBOuter = pointOnRadius(
        oppositeRadial,
        BASE_OUTER_RADIUS,
        yPosition,
        splitB,
      )
      const baseBInner = pointOnRadius(
        oppositeRadial,
        BASE_INNER_RADIUS,
        yPosition,
        splitB,
      )

      return {
        pair,
        tangent,
        backboneA,
        backboneB,
        baseAOuter,
        baseAInner,
        baseBOuter,
        baseBInner,
        labelA: baseAOuter.clone().add(baseAInner).multiplyScalar(0.5),
        labelB: baseBOuter.clone().add(baseBInner).multiplyScalar(0.5),
      }
    })
  }, [basePairs, modelParams])

  if (basePairs.length === 0) {
    return (
      <Billboard position={[0, 0, 0]}>
        <Text
          fontSize={0.22}
          color="#334155"
          anchorX="center"
          textAlign="center"
          maxWidth={4.8}
        >
          {emptyMessage}
        </Text>
      </Billboard>
    )
  }

  return (
    <group rotation={[0.05, 0, 0]} scale={modelScale}>
      {effectiveVisibility.showBackbone ? (
        <>
          <RibbonBackbone
            points={pairGeometry.map((geometry) => geometry.backboneA)}
            color="#8bdff2"
            edgeColor="#0891b2"
          />
          <RibbonBackbone
            points={pairGeometry.map((geometry) => geometry.backboneB)}
            color="#0ea5e9"
            edgeColor="#075985"
          />
        </>
      ) : null}

      {effectiveVisibility.showBases
        ? pairGeometry.map((geometry) => {
            const pairIsSelected = selection?.pair.id === geometry.pair.id
            const baseAIsSelected =
              pairIsSelected && selection?.base === geometry.pair.base
            const baseBIsSelected =
              pairIsSelected && selection?.base === geometry.pair.complement
            const baseAIsHovered =
              hoveredBase?.pairId === geometry.pair.id &&
              hoveredBase.base === geometry.pair.base
            const baseBIsHovered =
              hoveredBase?.pairId === geometry.pair.id &&
              hoveredBase.base === geometry.pair.complement

            return (
              <group key={geometry.pair.id}>
                {effectiveVisibility.showBackbone ? (
                  <>
                    <CylinderBetween
                      start={geometry.backboneA}
                      end={geometry.baseAOuter}
                      radius={0.008}
                      color="#0f172a"
                      opacity={0.5}
                    />
                    <CylinderBetween
                      start={geometry.backboneB}
                      end={geometry.baseBOuter}
                      radius={0.008}
                      color="#0f172a"
                      opacity={0.5}
                    />
                  </>
                ) : null}

                <BaseBlock
                  pair={geometry.pair}
                  base={geometry.pair.base}
                  start={geometry.baseAOuter}
                  end={geometry.baseAInner}
                  labelPosition={geometry.labelA}
                  showLabel={effectiveVisibility.showLabels}
                  isSelected={baseAIsSelected}
                  isHovered={baseAIsHovered}
                  onSelect={onSelect}
                  onHover={() =>
                    setHoveredBase({
                      pairId: geometry.pair.id,
                      base: geometry.pair.base,
                    })
                  }
                  onLeave={() => setHoveredBase(null)}
                />
                <BaseBlock
                  pair={geometry.pair}
                  base={geometry.pair.complement}
                  start={geometry.baseBOuter}
                  end={geometry.baseBInner}
                  labelPosition={geometry.labelB}
                  showLabel={effectiveVisibility.showLabels}
                  isSelected={baseBIsSelected}
                  isHovered={baseBIsHovered}
                  onSelect={onSelect}
                  onHover={() =>
                    setHoveredBase({
                      pairId: geometry.pair.id,
                      base: geometry.pair.complement,
                    })
                  }
                  onLeave={() => setHoveredBase(null)}
                />

                {effectiveVisibility.showHydrogenBonds ? (
                  <DottedHydrogenBonds
                    geometry={geometry}
                    highlightPairs={effectiveVisibility.highlightPairs}
                    onSelect={onSelect}
                  />
                ) : null}
              </group>
            )
          })
        : null}
    </group>
  )
}
