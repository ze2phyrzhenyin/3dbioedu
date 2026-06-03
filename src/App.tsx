import { useEffect, useMemo, useState } from 'react'
import { Languages } from 'lucide-react'

import { AssemblyHelpPanel } from './components/AssemblyHelpPanel'
import { AssemblyWorkbench } from './components/AssemblyWorkbench'
import { ControlPanel } from './components/ControlPanel'
import { DnaScene } from './components/DnaScene'
import { InfoPanel } from './components/InfoPanel'
import { SequenceInput } from './components/SequenceInput'
import { StepGuide } from './components/StepGuide'
import {
  DEFAULT_DNA_SEQUENCE,
  MAX_DISPLAYED_BASE_PAIRS,
  localize,
  uiText,
} from './data/scienceContent'
import { useLanguage } from './languageContext'
import type { DnaSelection, LearningMode, StepId, ViewOptions } from './types'
import {
  type DnaBase,
  generateBasePairs,
  getComplementSequence,
  validateDnaSequence,
} from './utils/dna'
import './styles.css'

const initialOptions: ViewOptions = {
  showLabels: true,
  highlightPairs: false,
  showBackbone: true,
  showHydrogenBonds: true,
  splitOpen: false,
}

function App() {
  const { language, toggleLanguage } = useLanguage()
  const [learningMode, setLearningMode] = useState<LearningMode>('explore')
  const [sequenceInput, setSequenceInput] = useState(DEFAULT_DNA_SEQUENCE)
  const [activeSequence, setActiveSequence] = useState(DEFAULT_DNA_SEQUENCE)
  const [assemblySequence, setAssemblySequence] = useState('')
  const [selectionKey, setSelectionKey] = useState<{
    pairId: string
    base: DnaBase
  } | null>({
    pairId: 'base-pair-0',
    base: 'A',
  })
  const [options, setOptions] = useState<ViewOptions>(initialOptions)
  const [currentStep, setCurrentStep] = useState<StepId>(4)
  const [resetViewKey, setResetViewKey] = useState(0)

  const validation = useMemo(
    () => validateDnaSequence(sequenceInput),
    [sequenceInput],
  )

  const complementSequence = useMemo(() => {
    if (!validation.isValid) {
      return ''
    }

    return getComplementSequence(validation.sequence)
  }, [validation])

  const modelSourceSequence =
    learningMode === 'assemble' ? assemblySequence : activeSequence

  const displayedSequence = useMemo(
    () => modelSourceSequence.slice(0, MAX_DISPLAYED_BASE_PAIRS),
    [modelSourceSequence],
  )

  const basePairs = useMemo(
    () => generateBasePairs(displayedSequence),
    [displayedSequence],
  )

  const isTruncated =
    learningMode === 'explore' && activeSequence.length > MAX_DISPLAYED_BASE_PAIRS

  const selection = useMemo<DnaSelection | null>(() => {
    const fallbackPair = basePairs[0]

    if (!fallbackPair) {
      return null
    }

    const selectedPair = selectionKey
      ? basePairs.find((pair) => pair.id === selectionKey.pairId)
      : fallbackPair

    if (!selectedPair) {
      return {
        pair: fallbackPair,
        base: fallbackPair.base,
      }
    }

    const selectedBase =
      selectionKey?.base === selectedPair.base ||
      selectionKey?.base === selectedPair.complement
        ? selectionKey.base
        : selectedPair.base

    return {
      pair: selectedPair,
      base: selectedBase,
    }
  }, [basePairs, selectionKey])

  const handleSequenceChange = (value: string) => {
    const nextValue = value.toUpperCase()
    const nextValidation = validateDnaSequence(nextValue)

    setSequenceInput(nextValue)

    if (nextValidation.isValid) {
      setActiveSequence(nextValidation.sequence)
    }
  }

  const handleLearningModeChange = (mode: LearningMode) => {
    setLearningMode(mode)

    if (mode === 'assemble') {
      setCurrentStep(4)
      setOptions((currentOptions) => ({
        ...currentOptions,
        showLabels: true,
        showBackbone: true,
        showHydrogenBonds: true,
        highlightPairs: true,
        splitOpen: false,
      }))
    }
  }

  const handleBuildHelixFromAssembly = (sequence: string) => {
    setActiveSequence(sequence)
    setSequenceInput(sequence)
    setAssemblySequence(sequence)
    setCurrentStep(4)
    setOptions((currentOptions) => ({
      ...currentOptions,
      showLabels: true,
      showBackbone: true,
      showHydrogenBonds: true,
      highlightPairs: true,
      splitOpen: false,
    }))
    setResetViewKey((key) => key + 1)
  }

  useEffect(() => {
    document.title = localize(uiText.app.title, language)
  }, [language])

  const modelScene = (
    <DnaScene
      basePairs={basePairs}
      selection={selection}
      options={options}
      currentStep={currentStep}
      resetViewKey={resetViewKey}
      compact={learningMode === 'assemble'}
      emptyMessage={
        learningMode === 'assemble'
          ? localize(uiText.app.assemblyEmptyMessage, language)
          : undefined
      }
      onSelect={(nextSelection) =>
        setSelectionKey({
          pairId: nextSelection.pair.id,
          base: nextSelection.base,
        })
      }
    />
  )

  const controls = (
    <ControlPanel
      options={options}
      onOptionsChange={setOptions}
      onResetView={() => setResetViewKey((key) => key + 1)}
    />
  )

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{localize(uiText.app.eyebrow, language)}</p>
          <h1>{localize(uiText.app.title, language)}</h1>
        </div>
        <div className="header-tools">
          <p className="header-summary">
            {localize(uiText.app.summary, language)}
          </p>
          <div className="header-actions">
            <button
              type="button"
              className="language-button"
              aria-label={localize(uiText.language.ariaLabel, language)}
              title={localize(uiText.language.ariaLabel, language)}
              onClick={toggleLanguage}
            >
              <Languages size={17} aria-hidden="true" />
              <span>{localize(uiText.language.switchLabel, language)}</span>
            </button>
            <div
              className="mode-switch"
              role="group"
              aria-label={localize(uiText.app.modeLabel, language)}
            >
              <button
                type="button"
                className={`mode-button ${
                  learningMode === 'explore' ? 'is-active' : ''
                }`}
                aria-pressed={learningMode === 'explore'}
                onClick={() => handleLearningModeChange('explore')}
              >
                {localize(uiText.app.exploreMode, language)}
              </button>
              <button
                type="button"
                className={`mode-button ${
                  learningMode === 'assemble' ? 'is-active' : ''
                }`}
                aria-pressed={learningMode === 'assemble'}
                onClick={() => handleLearningModeChange('assemble')}
              >
                {localize(uiText.app.assembleMode, language)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {learningMode === 'assemble' ? (
        <div className="assembly-workspace">
          <section
            className="assembly-main-grid"
            aria-label={localize(uiText.app.assemblyWorkspaceLabel, language)}
          >
            <AssemblyWorkbench
              onAssembledSequenceChange={setAssemblySequence}
              onBuildHelix={handleBuildHelixFromAssembly}
            />
            <div className="assembly-preview-stack">
              {modelScene}
              <InfoPanel selection={selection} />
            </div>
          </section>

          <aside className="sidebar assembly-sidebar">
            {controls}
            <AssemblyHelpPanel />
          </aside>
        </div>
      ) : (
        <div className="workspace">
          <aside className="sidebar sidebar-left">
            {controls}
            <StepGuide
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </aside>

          <section
            className="stage-column"
            aria-label={localize(uiText.app.stageLabel, language)}
          >
            {modelScene}
          </section>

          <aside className="sidebar sidebar-right">
            <InfoPanel selection={selection} />
            <SequenceInput
              value={sequenceInput}
              activeSequence={activeSequence}
              displayedSequence={displayedSequence}
              complementSequence={complementSequence}
              isTruncated={isTruncated}
              validation={validation}
              onChange={handleSequenceChange}
            />
          </aside>
        </div>
      )}
    </main>
  )
}

export default App
