import { OrbitControls, Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { localize } from '../data/scienceContent'
import type { Language } from '../types'
import type {
  GlobalCirculationResult,
  PressureBelt,
  WindBelt,
} from '../utils/geography'

interface EarthCirculationSceneProps {
  result: GlobalCirculationResult
  language: Language
  isPlaying: boolean
  onLatitudeSelect: (latitude: number) => void
}

interface FlowCurveProps {
  color: string
  curve: THREE.CatmullRomCurve3
  isPlaying: boolean
  opacity?: number
  particleCount?: number
  speed?: number
  tubeRadius?: number
}

interface LatitudeRingProps {
  color: string
  latitude: number
  onClick?: () => void
  opacity?: number
  radius?: number
  tubeRadius?: number
}

interface LandMass {
  id: string
  coordinates: Array<[number, number]>
}

const EARTH_RADIUS = 2.35
const LAND_RADIUS = EARTH_RADIUS + 0.028
const SURFACE_RADIUS = 2.48
const FRONT_AIR_Z = 2.08
const WIND_LONGITUDES = [-72, 72]
const GUIDE_LATITUDES = [-60, -30, 0, 30, 60]

const LAND_MASSES: LandMass[] = [
  {
    id: 'north-america',
    coordinates: [
      [70, -158],
      [68, -126],
      [58, -108],
      [50, -82],
      [38, -72],
      [24, -82],
      [16, -99],
      [26, -118],
      [40, -126],
      [54, -146],
    ],
  },
  {
    id: 'south-america',
    coordinates: [
      [12, -82],
      [8, -60],
      [-5, -48],
      [-16, -42],
      [-32, -52],
      [-55, -70],
      [-34, -75],
      [-18, -78],
    ],
  },
  {
    id: 'greenland',
    coordinates: [
      [82, -56],
      [75, -28],
      [62, -40],
      [66, -70],
    ],
  },
  {
    id: 'eurasia',
    coordinates: [
      [72, -12],
      [70, 30],
      [61, 68],
      [50, 138],
      [38, 146],
      [30, 124],
      [17, 106],
      [14, 92],
      [22, 66],
      [34, 34],
      [42, 16],
      [44, -8],
    ],
  },
  {
    id: 'africa',
    coordinates: [
      [36, -16],
      [32, 12],
      [24, 34],
      [8, 50],
      [-28, 34],
      [-36, 18],
      [-20, 2],
      [-8, -18],
    ],
  },
  {
    id: 'australia',
    coordinates: [
      [-10, 113],
      [-13, 151],
      [-31, 154],
      [-40, 130],
      [-29, 112],
    ],
  },
]

const sceneText = {
  wet: {
    fr: 'monte / pluie',
    zh: '上升 / 云雨',
  },
  dry: {
    fr: 'descend / sec',
    zh: '下沉 / 少雨',
  },
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

function clampLatitude(latitude: number) {
  return Math.min(88, Math.max(-88, latitude))
}

function sphericalPoint(latitude: number, longitude: number, radius = EARTH_RADIUS) {
  const lat = toRadians(latitude)
  const lon = toRadians(longitude)
  const cosLat = Math.cos(lat)

  return new THREE.Vector3(
    radius * cosLat * Math.sin(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.cos(lon),
  )
}

function ringRadius(latitude: number, radius = EARTH_RADIUS) {
  return Math.max(0.01, Math.cos(toRadians(latitude)) * radius)
}

function pressureColor(belt: PressureBelt) {
  if (belt.type === 'equatorialLow' || belt.type === 'subpolarLow') {
    return '#38bdf8'
  }

  return '#f59e0b'
}

function windColor(wind: WindBelt) {
  if (wind.type === 'trade') return '#10b981'
  if (wind.type === 'westerly') return '#2563eb'
  return '#64748b'
}

function getSelectedPressureLabel(result: GlobalCirculationResult) {
  const isWet =
    result.inspection.pressureBeltType === 'equatorialLow' ||
    result.inspection.pressureBeltType === 'subpolarLow'

  return isWet ? sceneText.wet : sceneText.dry
}

function createLandTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512

  const context = canvas.getContext('2d')
  if (!context) {
    return new THREE.CanvasTexture(canvas)
  }

  const project = ([latitude, longitude]: [number, number]) => ({
    x: ((longitude + 180) / 360) * canvas.width,
    y: ((90 - latitude) / 180) * canvas.height,
  })

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.lineJoin = 'round'
  context.lineCap = 'round'

  LAND_MASSES.forEach((landMass) => {
    const [firstCoordinate, ...restCoordinates] = landMass.coordinates
    const firstPoint = project(firstCoordinate)

    context.beginPath()
    context.moveTo(firstPoint.x, firstPoint.y)

    restCoordinates.forEach((coordinate) => {
      const point = project(coordinate)
      context.lineTo(point.x, point.y)
    })

    context.closePath()
    context.fillStyle = 'rgba(93, 171, 120, 0.66)'
    context.strokeStyle = 'rgba(43, 129, 89, 0.7)'
    context.lineWidth = 4
    context.fill()
    context.stroke()
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

function makeSurfaceWindCurve(wind: WindBelt, longitudeOffset: number) {
  const middleLatitude = (wind.fromLatitude + wind.toLatitude) / 2
  const direction = wind.directionDegrees
  const eastward =
    direction < 90 ||
    direction > 270 ||
    wind.type === 'westerly'
  const sweep = eastward ? 84 : -84
  const startLongitude = longitudeOffset - sweep / 2

  const points = Array.from({ length: 18 }, (_, index) => {
    const ratio = index / 17
    const wave = Math.sin(ratio * Math.PI) * (wind.hemisphere === 'north' ? 5 : -5)
    const latitude = clampLatitude(middleLatitude + wave)
    const longitude = startLongitude + sweep * ratio

    return sphericalPoint(latitude, longitude, SURFACE_RADIUS)
  })

  return new THREE.CatmullRomCurve3(points)
}

function makeCellCurve(fromLatitude: number, toLatitude: number) {
  const middleLatitude = (fromLatitude + toLatitude) / 2
  const fromY = Math.sin(toRadians(fromLatitude)) * EARTH_RADIUS
  const middleY = Math.sin(toRadians(middleLatitude)) * EARTH_RADIUS
  const toY = Math.sin(toRadians(toLatitude)) * EARTH_RADIUS
  const height = Math.max(0.35, Math.abs(fromY - toY))
  const innerX = height > 1.05 ? -0.92 : -0.68
  const outerX = height > 1.05 ? 0.92 : 0.68
  const bowX = height > 1.05 ? 1.26 : 0.94

  const points = [
    new THREE.Vector3(innerX, fromY, FRONT_AIR_Z),
    new THREE.Vector3(-bowX, middleY, FRONT_AIR_Z + 0.1),
    new THREE.Vector3(innerX, toY, FRONT_AIR_Z),
    new THREE.Vector3(outerX, toY, FRONT_AIR_Z),
    new THREE.Vector3(bowX, middleY, FRONT_AIR_Z + 0.1),
    new THREE.Vector3(outerX, fromY, FRONT_AIR_Z),
    new THREE.Vector3(innerX, fromY, FRONT_AIR_Z),
  ]

  return new THREE.CatmullRomCurve3(points, true)
}

function getCirculationCurves(result: GlobalCirculationResult) {
  const shiftedLatitude = (latitude: number) =>
    clampLatitude(latitude + result.seasonalShift)

  return [
    {
      id: 'south-polar',
      color: '#64748b',
      curve: makeCellCurve(-86, shiftedLatitude(-60)),
    },
    {
      id: 'south-ferrel',
      color: '#2563eb',
      curve: makeCellCurve(shiftedLatitude(-30), shiftedLatitude(-60)),
    },
    {
      id: 'south-hadley',
      color: '#10b981',
      curve: makeCellCurve(shiftedLatitude(-30), shiftedLatitude(0)),
    },
    {
      id: 'north-hadley',
      color: '#10b981',
      curve: makeCellCurve(shiftedLatitude(30), shiftedLatitude(0)),
    },
    {
      id: 'north-ferrel',
      color: '#2563eb',
      curve: makeCellCurve(shiftedLatitude(30), shiftedLatitude(60)),
    },
    {
      id: 'north-polar',
      color: '#64748b',
      curve: makeCellCurve(86, shiftedLatitude(60)),
    },
  ]
}

function canUseWebGl() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return true
  }

  try {
    const canvas = document.createElement('canvas')
    const context =
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))

    context?.getExtension('WEBGL_lose_context')?.loseContext()

    return Boolean(context)
  } catch {
    return false
  }
}

function LatitudeRing({
  color,
  latitude,
  onClick,
  opacity = 0.72,
  radius = EARTH_RADIUS,
  tubeRadius = 0.01,
}: LatitudeRingProps) {
  return (
    <mesh
      position={[0, Math.sin(toRadians(latitude)) * radius, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.()
      }}
    >
      <torusGeometry args={[ringRadius(latitude, radius), tubeRadius, 96, 12]} />
      <meshBasicMaterial
        color={color}
        depthWrite={false}
        opacity={opacity}
        transparent
      />
    </mesh>
  )
}

function FlowCurve({
  color,
  curve,
  isPlaying,
  opacity = 0.72,
  particleCount = 3,
  speed = 0.08,
  tubeRadius = 0.018,
}: FlowCurveProps) {
  const particlesRef = useRef<THREE.Group>(null)
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 90, tubeRadius, 8, false),
    [curve, tubeRadius],
  )
  const offsets = useMemo(
    () => Array.from({ length: particleCount }, (_, index) => index / particleCount),
    [particleCount],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(({ clock }) => {
    const particles = particlesRef.current
    if (!particles) return

    const elapsed = clock.getElapsedTime()
    const time = isPlaying ? elapsed * speed : 0.16

    offsets.forEach((offset, index) => {
      const particle = particles.children[index]
      if (!particle) return

      const point = curve.getPointAt((time + offset) % 1)
      particle.position.copy(point)
    })
  })

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={color}
          depthWrite={false}
          opacity={opacity}
          transparent
        />
      </mesh>
      <group ref={particlesRef}>
        {offsets.map((offset) => (
          <mesh key={offset}>
            <sphereGeometry args={[tubeRadius * 4.2, 16, 16]} />
            <meshBasicMaterial color={color} depthWrite={false} transparent />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function LandTextureLayer() {
  const landTexture = useMemo(() => createLandTexture(), [])

  useEffect(() => () => landTexture.dispose(), [landTexture])

  return (
    <mesh renderOrder={1} rotation={[0, -Math.PI / 2, 0]}>
      <sphereGeometry args={[LAND_RADIUS, 96, 48]} />
      <meshBasicMaterial
        color="#7fcf98"
        depthWrite={false}
        map={landTexture}
        opacity={0.72}
        transparent
      />
    </mesh>
  )
}

function GlobeShell({
  result,
  language,
  onLatitudeSelect,
}: {
  result: GlobalCirculationResult
  language: Language
  onLatitudeSelect: (latitude: number) => void
}) {
  const selectedLabel = localize(getSelectedPressureLabel(result), language)

  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 96, 48]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.18}
          color="#dff7ff"
          depthWrite={false}
          emissive="#dbeafe"
          emissiveIntensity={0.16}
          ior={1.2}
          metalness={0}
          opacity={0.34}
          roughness={0.18}
          thickness={1.2}
          transmission={0.22}
          transparent
        />
      </mesh>
      <mesh scale={1.026}>
        <sphereGeometry args={[EARTH_RADIUS, 64, 32]} />
        <meshBasicMaterial
          color="#bfdbfe"
          depthWrite={false}
          opacity={0.16}
          side={THREE.BackSide}
          transparent
        />
      </mesh>
      <mesh scale={0.76}>
        <sphereGeometry args={[EARTH_RADIUS, 48, 24]} />
        <meshBasicMaterial
          color="#ecfeff"
          depthWrite={false}
          opacity={0.2}
          transparent
        />
      </mesh>
      <LandTextureLayer />

      {GUIDE_LATITUDES.map((latitude) => (
        <LatitudeRing
          color={latitude === 0 ? '#fbbf24' : '#94a3b8'}
          key={latitude}
          latitude={latitude}
          opacity={latitude === 0 ? 0.5 : 0.2}
          tubeRadius={latitude === 0 ? 0.011 : 0.005}
          onClick={() => onLatitudeSelect(latitude)}
        />
      ))}

      <LatitudeRing
        color="#ef4444"
        latitude={result.inspection.latitude}
        opacity={0.95}
        radius={EARTH_RADIUS + 0.045}
        tubeRadius={0.018}
      />
      <Text
        color="#991b1b"
        fontSize={0.13}
        fontWeight={800}
        maxWidth={1.4}
        outlineColor="#ffffff"
        outlineWidth={0.018}
        position={sphericalPoint(result.inspection.latitude, 62, EARTH_RADIUS + 0.22)}
        textAlign="center"
      >
        {selectedLabel}
      </Text>
    </group>
  )
}

function PressureBelts({
  belts,
  onLatitudeSelect,
}: {
  belts: PressureBelt[]
  onLatitudeSelect: (latitude: number) => void
}) {
  return (
    <group>
      {belts
        .filter((belt) => Math.abs(belt.centerLatitude) <= 70)
        .map((belt) => (
          <LatitudeRing
            color={pressureColor(belt)}
            key={belt.id}
            latitude={belt.centerLatitude}
            opacity={belt.type === 'equatorialLow' ? 0.78 : 0.56}
            radius={EARTH_RADIUS + 0.08}
            tubeRadius={belt.type === 'equatorialLow' ? 0.05 : 0.038}
            onClick={() => onLatitudeSelect(belt.centerLatitude)}
          />
        ))}
    </group>
  )
}

function SurfaceWinds({
  isPlaying,
  winds,
  onLatitudeSelect,
}: {
  isPlaying: boolean
  winds: WindBelt[]
  onLatitudeSelect: (latitude: number) => void
}) {
  return (
    <group>
      {winds.flatMap((wind) =>
        WIND_LONGITUDES.map((longitude) => {
          const curve = makeSurfaceWindCurve(wind, longitude)
          const middleLatitude = (wind.fromLatitude + wind.toLatitude) / 2

          return (
            <group
              key={`${wind.id}-${longitude}`}
              onClick={(event) => {
                event.stopPropagation()
                onLatitudeSelect(middleLatitude)
              }}
            >
              <FlowCurve
                color={windColor(wind)}
                curve={curve}
                isPlaying={isPlaying}
                opacity={0.36}
                particleCount={1}
                speed={0.075 + wind.speed / 1600}
                tubeRadius={0.01}
              />
            </group>
          )
        }),
      )}
    </group>
  )
}

function CirculationCells({
  isPlaying,
  result,
}: {
  isPlaying: boolean
  result: GlobalCirculationResult
}) {
  const cells = getCirculationCurves(result)

  return (
    <group>
      {cells.map((cell) => (
        <FlowCurve
          color={cell.color}
          curve={cell.curve}
          isPlaying={isPlaying}
          key={cell.id}
          opacity={cell.id.includes('hadley') ? 0.46 : 0.28}
          particleCount={1}
          speed={0.038}
          tubeRadius={cell.id.includes('hadley') ? 0.038 : 0.028}
        />
      ))}
    </group>
  )
}

function HeatAndSun({
  latitude,
  isPlaying,
}: {
  latitude: number
  isPlaying: boolean
}) {
  const sunRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (!sunRef.current) return

    sunRef.current.rotation.z = isPlaying ? clock.getElapsedTime() * 0.28 : 0.1
  })

  return (
    <group>
      <LatitudeRing
        color="#f59e0b"
        latitude={latitude}
        opacity={0.9}
        radius={EARTH_RADIUS + 0.16}
        tubeRadius={0.07}
      />
      <group ref={sunRef} position={[-3.1, Math.sin(toRadians(latitude)) * 1.12, 1.42]}>
        <mesh>
          <sphereGeometry args={[0.25, 32, 16]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.43, 32, 16]} />
          <meshBasicMaterial color="#fde68a" opacity={0.25} transparent />
        </mesh>
      </group>
    </group>
  )
}

function WeatherColumns({
  result,
}: {
  result: GlobalCirculationResult
}) {
  return (
    <group>
      {result.pressureBelts
        .filter((belt) => Math.abs(belt.centerLatitude) <= 62)
        .map((belt) => {
          const isWet =
            belt.type === 'equatorialLow' || belt.type === 'subpolarLow'
          const point = sphericalPoint(belt.centerLatitude, 26, EARTH_RADIUS + 0.28)

          return (
            <group key={belt.id} position={point}>
              <mesh rotation={[0, 0, isWet ? 0 : Math.PI]}>
                <coneGeometry args={[0.06, 0.28, 20]} />
                <meshBasicMaterial color={isWet ? '#0284c7' : '#d97706'} />
              </mesh>
              <mesh position={[0, isWet ? 0.14 : -0.14, 0]}>
                <cylinderGeometry args={[0.022, 0.022, 0.3, 12]} />
                <meshBasicMaterial color={isWet ? '#0284c7' : '#d97706'} />
              </mesh>
            </group>
          )
        })}
    </group>
  )
}

function CameraRig({ isPlaying }: { isPlaying: boolean }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  useFrame(({ clock, camera }) => {
    if (!isPlaying) return

    const t = clock.getElapsedTime() * 0.08
    camera.position.x = Math.sin(t) * 0.45
    camera.position.z = 8.6 + Math.cos(t) * 0.22
    controlsRef.current?.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={false}
      dampingFactor={0.08}
      enableDamping
      enablePan={false}
      makeDefault
      maxZoom={110}
      minZoom={58}
      maxDistance={10.2}
      minDistance={5.2}
      target={[0, 0, 0]}
    />
  )
}

function EarthSceneContent({
  result,
  language,
  isPlaying,
  onLatitudeSelect,
}: EarthCirculationSceneProps) {
  return (
    <>
      <color attach="background" args={['#f8fbff']} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[-4.4, 2.4, 3.4]} intensity={2.2} />
      <pointLight position={[3.8, -2.5, 4.8]} intensity={0.42} />

      <group rotation={[0.08, -0.34, 0]} scale={0.78}>
        <HeatAndSun
          isPlaying={isPlaying}
          latitude={result.solarDeclination}
        />
        <GlobeShell
          result={result}
          language={language}
          onLatitudeSelect={onLatitudeSelect}
        />
        <PressureBelts
          belts={result.pressureBelts}
          onLatitudeSelect={onLatitudeSelect}
        />
        <SurfaceWinds
          isPlaying={isPlaying}
          winds={result.windBelts}
          onLatitudeSelect={onLatitudeSelect}
        />
        <CirculationCells isPlaying={isPlaying} result={result} />
        <WeatherColumns result={result} />
      </group>

      <CameraRig isPlaying={isPlaying} />
    </>
  )
}

function EarthFallback({
  language,
  result,
}: {
  language: Language
  result: GlobalCirculationResult
}) {
  const selectedLabel = localize(getSelectedPressureLabel(result), language)

  return (
    <div className="earth-scene-fallback">
      <div className="earth-fallback-globe">
        <span className="earth-fallback-heat" />
        <span className="earth-fallback-selected" />
        <span className="earth-fallback-wind is-one" />
        <span className="earth-fallback-wind is-two" />
      </div>
      <strong>{selectedLabel}</strong>
    </div>
  )
}

export function EarthCirculationScene({
  result,
  language,
  isPlaying,
  onLatitudeSelect,
}: EarthCirculationSceneProps) {
  const webGlAvailable = useMemo(() => canUseWebGl(), [])
  const [webGlFailed, setWebGlFailed] = useState(false)
  const fallback = <EarthFallback language={language} result={result} />

  if (!webGlAvailable || webGlFailed) {
    return fallback
  }

  return (
    <div className="earth-circulation-scene">
      <Canvas
        dpr={[1, 2]}
        fallback={fallback}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        orthographic
        camera={{ position: [0, 0.18, 8.6], zoom: 92, near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          const handleContextLost = (event: Event) => {
            event.preventDefault()
            setWebGlFailed(true)
          }

          gl.domElement.addEventListener('webglcontextlost', handleContextLost)
        }}
      >
        <Suspense fallback={null}>
          <EarthSceneContent
            result={result}
            language={language}
            isPlaying={isPlaying}
            onLatitudeSelect={onLatitudeSelect}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
