import { useEffect, useMemo, useState } from 'react'

import { AssemblyHelpPanel } from './components/AssemblyHelpPanel'
import { AssemblyWorkbench } from './components/AssemblyWorkbench'
import { ControlPanel } from './components/ControlPanel'
import { DnaScene } from './components/DnaScene'
import { EcosystemLab } from './components/EcosystemLab'
import { GeographyCirculationLab } from './components/GeographyCirculationLab'
import { InfoPanel } from './components/InfoPanel'
import { PhotosynthesisLab } from './components/PhotosynthesisLab'
import { SequenceInput } from './components/SequenceInput'
import { StepGuide } from './components/StepGuide'
import { WindReadingLab } from './components/WindReadingLab'
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

const developerContact = {
  label: {
    en: 'Developer contact',
    fr: 'Contact développeur',
    zh: '开发者联系方式',
  },
  wechat: {
    en: 'WeChat cebasmonde',
    fr: 'WeChat cebasmonde',
    zh: '微信 cebasmonde',
  },
  email: {
    en: 'Email zephyr2515 at gmail dot com',
    fr: 'E-mail zephyr2515 at gmail dot com',
    zh: '邮箱 zephyr2515 at gmail dot com',
  },
}

function App() {
  const { language, setLanguage } = useLanguage()
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
    document.title = localize(getAppTitle(learningMode), language)
  }, [language, learningMode])

  const appTitle = getAppTitle(learningMode)
  const appSummary = getAppSummary(learningMode)

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
          <h1>{localize(appTitle, language)}</h1>
        </div>
        <div className="header-tools">
          <p className="header-summary">
            {localize(appSummary, language)}
          </p>
          <div className="header-actions">
            <div
              className="language-button language-switcher"
              role="group"
              aria-label={localize(uiText.language.ariaLabel, language)}
              title={localize(uiText.language.ariaLabel, language)}
            >
              {(['en', 'fr', 'zh'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={language === option ? 'is-active' : ''}
                  aria-pressed={language === option}
                  onClick={() => setLanguage(option)}
                >
                  {option === 'en' ? 'EN' : option === 'fr' ? 'FR' : '中文'}
                </button>
              ))}
            </div>
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
              <button
                type="button"
                className={`mode-button ${
                  learningMode === 'metabolism' ? 'is-active' : ''
                }`}
                aria-pressed={learningMode === 'metabolism'}
                onClick={() => handleLearningModeChange('metabolism')}
              >
                {localize(uiText.app.metabolismMode, language)}
              </button>
              <button
                type="button"
                className={`mode-button ${
                  learningMode === 'ecosystem' ? 'is-active' : ''
                }`}
                aria-pressed={learningMode === 'ecosystem'}
                onClick={() => handleLearningModeChange('ecosystem')}
              >
                {localize(uiText.app.ecosystemMode, language)}
              </button>
              <button
                type="button"
                className={`mode-button ${
                  learningMode === 'geography' ? 'is-active' : ''
                }`}
                aria-pressed={learningMode === 'geography'}
                onClick={() => handleLearningModeChange('geography')}
              >
                {localize(uiText.app.geographyMode, language)}
              </button>
              <button
                type="button"
                className={`mode-button ${
                  learningMode === 'wind' ? 'is-active' : ''
                }`}
                aria-pressed={learningMode === 'wind'}
                onClick={() => handleLearningModeChange('wind')}
              >
                {localize(uiText.app.windMode, language)}
              </button>
            </div>
          </div>
        </div>
      </header>

      {learningMode === 'wind' ? (
        <section
          aria-label={localize(uiText.app.windWorkspaceLabel, language)}
        >
          <WindReadingLab />
        </section>
      ) : learningMode === 'geography' ? (
        <section
          aria-label={localize(uiText.app.geographyWorkspaceLabel, language)}
        >
          <GeographyCirculationLab />
        </section>
      ) : learningMode === 'ecosystem' ? (
        <section
          aria-label={localize(uiText.app.ecosystemWorkspaceLabel, language)}
        >
          <EcosystemLab />
        </section>
      ) : learningMode === 'metabolism' ? (
        <section
          aria-label={localize(uiText.app.metabolismWorkspaceLabel, language)}
        >
          <PhotosynthesisLab />
        </section>
      ) : learningMode === 'assemble' ? (
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
      <footer className="developer-footer">
        <span>{localize(developerContact.label, language)}</span>
        <span>{localize(developerContact.wechat, language)}</span>
        <span>{localize(developerContact.email, language)}</span>
      </footer>
    </main>
  )
}

function getAppTitle(learningMode: LearningMode) {
  if (learningMode === 'metabolism') {
    return uiText.app.metabolismTitle
  }

  if (learningMode === 'ecosystem') {
    return uiText.app.ecosystemTitle
  }

  if (learningMode === 'geography') {
    return uiText.app.geographyTitle
  }

  if (learningMode === 'wind') {
    return uiText.app.windTitle
  }

  return uiText.app.title
}

function getAppSummary(learningMode: LearningMode) {
  if (learningMode === 'metabolism') {
    return uiText.app.metabolismSummary
  }

  if (learningMode === 'ecosystem') {
    return uiText.app.ecosystemSummary
  }

  if (learningMode === 'geography') {
    return uiText.app.geographySummary
  }

  if (learningMode === 'wind') {
    return uiText.app.windSummary
  }

  return uiText.app.summary
}

export default App
