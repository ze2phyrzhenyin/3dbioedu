import type { CSSProperties, DragEvent } from 'react'
import { useMemo, useState } from 'react'
import { CheckCircle2, HelpCircle, RotateCcw, Shuffle } from 'lucide-react'

import {
  ASSEMBLY_CHALLENGE_SEQUENCES,
  assemblyContent,
  baseContent,
  localize,
  pairContent,
  uiText,
} from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { Language } from '../types'
import {
  evaluateBasePlacement,
  getAssemblyCompletion,
  getCompletedAssemblySequence,
} from '../utils/assembly'
import {
  type DnaBase,
  VALID_DNA_BASES,
  getComplementBase,
  getPairType,
  isDnaBase,
} from '../utils/dna'

type FeedbackState =
  | { tone: 'neutral'; kind: 'initial' }
  | { tone: 'neutral'; kind: 'hint'; slotNumber: number; templateBase: DnaBase; expectedBase: DnaBase }
  | { tone: 'success'; kind: 'correctPair'; templateBase: DnaBase; candidateBase: DnaBase; hydrogenBondCount: number }
  | { tone: 'success'; kind: 'complete' }
  | { tone: 'success'; kind: 'build' }
  | { tone: 'error'; kind: 'invalidBase' }
  | { tone: 'error'; kind: 'incorrectPair'; candidateBase: DnaBase; templateBase: DnaBase; expectedBase: DnaBase }
  | { tone: 'error'; kind: 'emptyBuild' }

interface AssemblyWorkbenchProps {
  onAssembledSequenceChange: (sequence: string) => void
  onBuildHelix: (sequence: string) => void
}

function getBaseChipStyle(base: DnaBase): CSSProperties {
  return {
    '--base-color': baseContent[base].color,
  } as CSSProperties
}

function getFeedbackMessage(feedback: FeedbackState, language: Language) {
  switch (feedback.kind) {
    case 'initial':
      return localize(assemblyContent.initialFeedback, language)
    case 'hint':
      return language === 'zh'
        ? `提示：第 ${feedback.slotNumber} 位模板碱基是 ${feedback.templateBase}，应选择 ${feedback.expectedBase}。`
        : language === 'fr'
        ? `Indice: la base modèle en position ${feedback.slotNumber} est ${feedback.templateBase}; choisissez ${feedback.expectedBase}.`
        : `Hint: the template base at position ${feedback.slotNumber} is ${feedback.templateBase}; choose ${feedback.expectedBase}.`
    case 'correctPair':
      return language === 'zh'
        ? `${localize(
            assemblyContent.correctFeedback,
            language,
          )} ${feedback.templateBase}-${feedback.candidateBase} 有 ${feedback.hydrogenBondCount} ${localize(
            uiText.assembly.hydrogenBondLines,
            language,
          )}。`
        : language === 'fr'
        ? `${localize(
            assemblyContent.correctFeedback,
            language,
          )} ${feedback.templateBase}-${feedback.candidateBase}: ${feedback.hydrogenBondCount} ${localize(
            uiText.assembly.hydrogenBondLines,
            language,
          )}.`
        : `${localize(assemblyContent.correctFeedback, language)} ${feedback.templateBase}-${feedback.candidateBase}: ${feedback.hydrogenBondCount} ${localize(uiText.assembly.hydrogenBondLines, language)}.`
    case 'complete':
      return localize(assemblyContent.completeFeedback, language)
    case 'build':
      return localize(assemblyContent.buildFeedback, language)
    case 'invalidBase':
      return localize(assemblyContent.invalidBaseFeedback, language)
    case 'incorrectPair':
      return language === 'zh'
        ? `${feedback.candidateBase} 不能与 ${feedback.templateBase} 配对；${feedback.templateBase} 应与 ${feedback.expectedBase} 配对。`
        : language === 'fr'
        ? `${feedback.candidateBase} ne s'apparie pas avec ${feedback.templateBase}; ${feedback.templateBase} doit s'apparier avec ${feedback.expectedBase}.`
        : `${feedback.candidateBase} does not pair with ${feedback.templateBase}; ${feedback.templateBase} must pair with ${feedback.expectedBase}.`
    case 'emptyBuild':
      return localize(assemblyContent.emptyBuildFeedback, language)
  }
}

export function AssemblyWorkbench({
  onAssembledSequenceChange,
  onBuildHelix,
}: AssemblyWorkbenchProps) {
  const { language } = useLanguage()
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [placedBases, setPlacedBases] = useState<Array<DnaBase | null>>(
    () => Array.from({ length: ASSEMBLY_CHALLENGE_SEQUENCES[0].length }, () => null),
  )
  const [selectedBase, setSelectedBase] = useState<DnaBase | null>(null)
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null)
  const [hintSlot, setHintSlot] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<FeedbackState>({
    tone: 'neutral',
    kind: 'initial',
  })

  const challengeSequence = ASSEMBLY_CHALLENGE_SEQUENCES[challengeIndex]
  const templateBases = useMemo(
    () => challengeSequence.split('') as DnaBase[],
    [challengeSequence],
  )
  const assembledSequence = useMemo(
    () => getCompletedAssemblySequence(challengeSequence, placedBases),
    [challengeSequence, placedBases],
  )
  const completion = useMemo(
    () => getAssemblyCompletion(challengeSequence, placedBases),
    [challengeSequence, placedBases],
  )
  const feedbackMessage = useMemo(
    () => getFeedbackMessage(feedback, language),
    [feedback, language],
  )

  const resetAssembly = (nextChallengeIndex = challengeIndex) => {
    const nextSequence = ASSEMBLY_CHALLENGE_SEQUENCES[nextChallengeIndex]
    setChallengeIndex(nextChallengeIndex)
    setPlacedBases(Array.from({ length: nextSequence.length }, () => null))
    setSelectedBase(null)
    setHighlightedSlot(null)
    setHintSlot(null)
    setFeedback({
      tone: 'neutral',
      kind: 'initial',
    })
    onAssembledSequenceChange('')
  }

  const placeBase = (slotIndex: number, candidateBase: DnaBase) => {
    const templateBase = templateBases[slotIndex]
    const evaluation = evaluateBasePlacement(templateBase, candidateBase)

    if (!evaluation.isValidBase) {
      setFeedback({
        tone: 'error',
        kind: 'invalidBase',
      })
      setHighlightedSlot(slotIndex)
      return
    }

    if (!evaluation.isCorrectPair) {
      setFeedback({
        tone: 'error',
        kind: 'incorrectPair',
        candidateBase,
        templateBase,
        expectedBase: evaluation.expectedBase,
      })
      setHighlightedSlot(slotIndex)
      return
    }

    const nextPlacedBases = [...placedBases]
    nextPlacedBases[slotIndex] = candidateBase
    const nextAssembledSequence = getCompletedAssemblySequence(
      challengeSequence,
      nextPlacedBases,
    )
    const nextCompletion = getAssemblyCompletion(
      challengeSequence,
      nextPlacedBases,
    )

    setPlacedBases(nextPlacedBases)
    setSelectedBase(null)
    setHighlightedSlot(null)
    setHintSlot(null)
    setFeedback({
      tone: 'success',
      ...(nextCompletion.isComplete
        ? { kind: 'complete' as const }
        : {
            kind: 'correctPair' as const,
            templateBase,
            candidateBase,
            hydrogenBondCount: evaluation.hydrogenBondCount,
          }),
    })
    onAssembledSequenceChange(nextAssembledSequence)
  }

  const clearSlot = (slotIndex: number) => {
    const nextPlacedBases = [...placedBases]
    nextPlacedBases[slotIndex] = null
    setPlacedBases(nextPlacedBases)
    setHighlightedSlot(null)
    setFeedback({
      tone: 'neutral',
      kind: 'initial',
    })
    onAssembledSequenceChange(
      getCompletedAssemblySequence(challengeSequence, nextPlacedBases),
    )
  }

  const handleDrop = (
    event: DragEvent<HTMLButtonElement>,
    slotIndex: number,
  ) => {
    event.preventDefault()
    const droppedBase = event.dataTransfer.getData('text/plain')

    if (isDnaBase(droppedBase)) {
      placeBase(slotIndex, droppedBase)
      return
    }

    setFeedback({
      tone: 'error',
      kind: 'invalidBase',
    })
  }

  const showNextHint = () => {
    const nextEmptySlot = placedBases.findIndex((base) => base === null)

    if (nextEmptySlot === -1) {
      setFeedback({
        tone: 'success',
        kind: 'complete',
      })
      return
    }

    const templateBase = templateBases[nextEmptySlot]
    const expectedBase = getComplementBase(templateBase)
    setHintSlot(nextEmptySlot)
    setFeedback({
      tone: 'neutral',
      kind: 'hint',
      slotNumber: nextEmptySlot + 1,
      templateBase,
      expectedBase,
    })
  }

  const buildHelix = () => {
    if (assembledSequence.length === 0) {
      setFeedback({
        tone: 'error',
        kind: 'emptyBuild',
      })
      return
    }

    setFeedback({
      tone: 'success',
      kind: 'build',
    })
    onBuildHelix(assembledSequence)
  }

  const switchChallenge = () => {
    resetAssembly((challengeIndex + 1) % ASSEMBLY_CHALLENGE_SEQUENCES.length)
  }

  return (
    <section
      className="panel assembly-workbench"
      aria-labelledby="assembly-title"
    >
      <div className="assembly-header">
        <div>
          <p className="eyebrow">
            {localize(uiText.assembly.eyebrow, language)}
          </p>
          <h2 id="assembly-title">
            {localize(assemblyContent.title, language)}
          </h2>
        </div>
        <div
          className="assembly-progress"
          aria-label={localize(uiText.assembly.progressLabel, language)}
        >
          <span>{completion.completedCount}</span>
          <span>/</span>
          <span>{completion.totalCount}</span>
        </div>
      </div>

      <p className="assembly-intro">
        {localize(assemblyContent.intro, language)}
      </p>

      <div className="assembly-progress-track" aria-hidden="true">
        <div
          className="assembly-progress-fill"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>

      <div
        className="base-palette"
        aria-label={localize(uiText.assembly.paletteLabel, language)}
      >
        {VALID_DNA_BASES.map((base) => (
          <button
            key={base}
            type="button"
            draggable
            className={`base-token ${selectedBase === base ? 'is-selected' : ''}`}
            style={getBaseChipStyle(base)}
            aria-pressed={selectedBase === base}
            onClick={() =>
              setSelectedBase((currentBase) =>
                currentBase === base ? null : base,
              )
            }
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', base)
              event.dataTransfer.effectAllowed = 'copy'
            }}
          >
            <span>{base}</span>
            <small>{localize(baseContent[base].name, language)}</small>
          </button>
        ))}
      </div>

      <div
        className="assembly-board"
        role="list"
        aria-label={localize(uiText.assembly.boardLabel, language)}
      >
        {templateBases.map((templateBase, slotIndex) => {
          const placedBase = placedBases[slotIndex]
          const expectedBase = getComplementBase(templateBase)
          const pairType = getPairType(templateBase, expectedBase)
          const pairTypeContent = pairContent[pairType]

          return (
            <div
              key={`${challengeSequence}-${slotIndex}`}
              className={`assembly-row ${
                placedBase ? 'is-complete' : ''
              } ${highlightedSlot === slotIndex ? 'is-error' : ''} ${
                hintSlot === slotIndex ? 'is-hinted' : ''
              }`}
              role="listitem"
            >
              <span className="assembly-index">{slotIndex + 1}</span>
              <span
                className="assembly-template-base"
                style={getBaseChipStyle(templateBase)}
              >
                {templateBase}
              </span>
              <span className="assembly-rung" aria-hidden="true" />
              <button
                type="button"
                className="assembly-slot"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, slotIndex)}
                onClick={() => {
                  if (selectedBase) {
                    placeBase(slotIndex, selectedBase)
                    return
                  }

                  if (placedBase) {
                    clearSlot(slotIndex)
                  }
                }}
                aria-label={
                  language === 'zh'
                    ? `第 ${slotIndex + 1} 位互补槽，模板碱基 ${templateBase}`
                    : language === 'fr'
                    ? `Emplacement complémentaire ${
                        slotIndex + 1
                      }, base modèle ${templateBase}`
                    : `Complementary slot ${slotIndex + 1}, template base ${templateBase}`
                }
              >
                {placedBase ?? localize(uiText.assembly.slotEmpty, language)}
              </button>
              <span className="assembly-pair-note">
                {placedBase ? (
                  <>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {templateBase}-{placedBase} ·{' '}
                    {pairTypeContent.hydrogenBondCount}{' '}
                    {localize(uiText.assembly.hydrogenBonds, language)}
                  </>
                ) : (
                  `${localize(
                    uiText.assembly.waitingFor,
                    language,
                  )} ${expectedBase}`
                )}
              </span>
            </div>
          )
        })}
      </div>

      <p className={`assembly-feedback is-${feedback.tone}`} role="status">
        {feedbackMessage}
      </p>

      <div className="assembly-actions">
        <button type="button" className="control-button" onClick={buildHelix}>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{localize(uiText.assembly.buildHelix, language)}</span>
        </button>
        <button type="button" className="control-button" onClick={showNextHint}>
          <HelpCircle size={18} aria-hidden="true" />
          <span>{localize(uiText.assembly.nextHint, language)}</span>
        </button>
        <button
          type="button"
          className="control-button"
          onClick={() => resetAssembly()}
        >
          <RotateCcw size={18} aria-hidden="true" />
          <span>{localize(uiText.assembly.reset, language)}</span>
        </button>
        <button type="button" className="control-button" onClick={switchChallenge}>
          <Shuffle size={18} aria-hidden="true" />
          <span>{localize(uiText.assembly.switchChallenge, language)}</span>
        </button>
      </div>
    </section>
  )
}
