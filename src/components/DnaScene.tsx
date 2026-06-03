import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { localize, uiText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { StepId, DnaSelection, ViewOptions } from '../types'
import type { BasePair } from '../utils/dna'
import { DnaFallbackView } from './DnaFallbackView'
import { DnaModel } from './DnaModel'

interface DnaSceneProps {
  basePairs: BasePair[]
  selection: DnaSelection | null
  options: ViewOptions
  currentStep: StepId
  resetViewKey: number
  compact?: boolean
  emptyMessage?: string
  onSelect: (selection: DnaSelection) => void
}

interface SceneFallbackProps {
  basePairs: BasePair[]
  selection: DnaSelection | null
  options: ViewOptions
  currentStep: StepId
  compact: boolean
  emptyMessage: string
  onSelect: (selection: DnaSelection) => void
}

interface SceneErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
  onError: (error: Error, errorInfo: ErrorInfo) => void
}

class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo)
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function SceneFallback({
  basePairs,
  selection,
  options,
  currentStep,
  compact,
  emptyMessage,
  onSelect,
}: SceneFallbackProps) {
  const { language } = useLanguage()

  return (
    <section
      className={`scene-panel ${compact ? 'is-compact' : ''}`}
      aria-label={localize(uiText.scene.diagramLabel, language)}
    >
      <SceneFallbackContent
        basePairs={basePairs}
        selection={selection}
        options={options}
        currentStep={currentStep}
        emptyMessage={emptyMessage}
        onSelect={onSelect}
      />
    </section>
  )
}

function SceneFallbackContent({
  basePairs,
  selection,
  options,
  currentStep,
  emptyMessage,
  onSelect,
}: Omit<SceneFallbackProps, 'compact'>) {
  return (
    <DnaFallbackView
      basePairs={basePairs}
      selection={selection}
      options={options}
      currentStep={currentStep}
      emptyMessage={emptyMessage}
      onSelect={onSelect}
    />
  )
}

function CameraControls({ resetViewKey }: { resetViewKey: number }) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  useEffect(() => {
    camera.position.set(0, 1.2, 8.8)
    camera.lookAt(0, 0, 0)
    controlsRef.current?.target.set(0, 0, 0)
    controlsRef.current?.update()
  }, [camera, resetViewKey])

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={12}
    />
  )
}

function CanvasHealthMonitor({
  onReady,
  onContextLost,
}: {
  onReady: () => void
  onContextLost: () => void
}) {
  const { gl } = useThree()

  useEffect(() => {
    onReady()

    const handleContextLost = (event: Event) => {
      event.preventDefault()
      onContextLost()
    }

    gl.domElement.addEventListener('webglcontextlost', handleContextLost)

    return () => {
      gl.domElement.removeEventListener('webglcontextlost', handleContextLost)
    }
  }, [gl, onContextLost, onReady])

  return null
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

export function DnaScene({
  basePairs,
  selection,
  options,
  currentStep,
  resetViewKey,
  compact = false,
  emptyMessage,
  onSelect,
}: DnaSceneProps) {
  const { language } = useLanguage()
  const webGlAvailable = useMemo(() => canUseWebGl(), [])
  const [canvasReady, setCanvasReady] = useState(false)
  const [webGlFailed, setWebGlFailed] = useState(false)
  const fallbackMessage =
    emptyMessage ?? localize(uiText.scene.emptySequence, language)
  const fallbackContent = (
    <SceneFallbackContent
      basePairs={basePairs}
      selection={selection}
      options={options}
      currentStep={currentStep}
      emptyMessage={fallbackMessage}
      onSelect={onSelect}
    />
  )
  const fallback = (
    <SceneFallback
      basePairs={basePairs}
      selection={selection}
      options={options}
      currentStep={currentStep}
      compact={compact}
      emptyMessage={fallbackMessage}
      onSelect={onSelect}
    />
  )

  const markCanvasReady = useCallback(() => {
    setCanvasReady(true)
  }, [])

  const handleWebGlFailure = useCallback(() => {
    setWebGlFailed(true)
  }, [])

  useEffect(() => {
    if (!webGlAvailable || webGlFailed || canvasReady) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setWebGlFailed(true)
    }, 3500)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [canvasReady, webGlAvailable, webGlFailed])

  if (!webGlAvailable || webGlFailed) {
    return fallback
  }

  return (
    <SceneErrorBoundary
      fallback={fallback}
      onError={handleWebGlFailure}
    >
      <section
        className={`scene-panel ${compact ? 'is-compact' : ''}`}
        aria-label={localize(uiText.scene.modelLabel, language)}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          fallback={fallbackContent}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          camera={{ position: [0, 1.2, 8.8], fov: 45, near: 0.1, far: 100 }}
        >
          <CanvasHealthMonitor
            onReady={markCanvasReady}
            onContextLost={handleWebGlFailure}
          />
          <color attach="background" args={['#f7fafc']} />
          <ambientLight intensity={0.9} />
          <directionalLight
            position={[4, 6, 5]}
            intensity={1.4}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-3, -2, 4]} intensity={0.45} />

          <Suspense fallback={null}>
            <DnaModel
              basePairs={basePairs}
              selection={selection}
              options={options}
              currentStep={currentStep}
              emptyMessage={fallbackMessage}
              onSelect={onSelect}
            />
          </Suspense>

          <CameraControls resetViewKey={resetViewKey} />
        </Canvas>
      </section>
    </SceneErrorBoundary>
  )
}
