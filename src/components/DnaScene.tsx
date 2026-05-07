import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import type { StepId, DnaSelection, ViewOptions } from '../types'
import type { BasePair } from '../utils/dna'
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
  const sceneIsEmpty = basePairs.length === 0

  return (
    <section
      className={`scene-panel ${compact ? 'is-compact' : ''} ${
        sceneIsEmpty ? 'is-empty' : ''
      }`}
      aria-label="DNA 双螺旋 3D 模型"
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [0, 1.2, 8.8], fov: 45, near: 0.1, far: 100 }}
      >
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
            emptyMessage={emptyMessage}
            onSelect={onSelect}
          />
        </Suspense>

        <CameraControls resetViewKey={resetViewKey} />
      </Canvas>
      {sceneIsEmpty ? (
        <div className="scene-empty-message" aria-live="polite">
          <span>{emptyMessage ?? '请输入 A/T/C/G 序列'}</span>
        </div>
      ) : null}
    </section>
  )
}
