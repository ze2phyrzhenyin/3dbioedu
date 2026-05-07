import type { CSSProperties, DragEvent } from 'react'
import { useMemo, useState } from 'react'
import { CheckCircle2, HelpCircle, RotateCcw, Shuffle } from 'lucide-react'

import {
  ASSEMBLY_CHALLENGE_SEQUENCES,
  assemblyContent,
  baseContent,
  pairContent,
} from '../data/scienceContent'
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

type FeedbackTone = 'neutral' | 'success' | 'error'

interface AssemblyWorkbenchProps {
  onAssembledSequenceChange: (sequence: string) => void
  onBuildHelix: (sequence: string) => void
}

function getBaseChipStyle(base: DnaBase): CSSProperties {
  return {
    '--base-color': baseContent[base].color,
  } as CSSProperties
}

export function AssemblyWorkbench({
  onAssembledSequenceChange,
  onBuildHelix,
}: AssemblyWorkbenchProps) {
  const [challengeIndex, setChallengeIndex] = useState(0)
  const [placedBases, setPlacedBases] = useState<Array<DnaBase | null>>(
    () => Array.from({ length: ASSEMBLY_CHALLENGE_SEQUENCES[0].length }, () => null),
  )
  const [selectedBase, setSelectedBase] = useState<DnaBase | null>(null)
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null)
  const [hintSlot, setHintSlot] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackTone
    message: string
  }>({
    tone: 'neutral',
    message: assemblyContent.initialFeedback,
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

  const resetAssembly = (nextChallengeIndex = challengeIndex) => {
    const nextSequence = ASSEMBLY_CHALLENGE_SEQUENCES[nextChallengeIndex]
    setChallengeIndex(nextChallengeIndex)
    setPlacedBases(Array.from({ length: nextSequence.length }, () => null))
    setSelectedBase(null)
    setHighlightedSlot(null)
    setHintSlot(null)
    setFeedback({
      tone: 'neutral',
      message: assemblyContent.initialFeedback,
    })
    onAssembledSequenceChange('')
  }

  const placeBase = (slotIndex: number, candidateBase: DnaBase) => {
    const templateBase = templateBases[slotIndex]
    const evaluation = evaluateBasePlacement(templateBase, candidateBase)

    if (!evaluation.isValidBase) {
      setFeedback({
        tone: 'error',
        message: assemblyContent.invalidBaseFeedback,
      })
      setHighlightedSlot(slotIndex)
      return
    }

    if (!evaluation.isCorrectPair) {
      setFeedback({
        tone: 'error',
        message: `${candidateBase} 不能与 ${templateBase} 配对；${templateBase} 应与 ${evaluation.expectedBase} 配对。`,
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
      message: nextCompletion.isComplete
        ? assemblyContent.completeFeedback
        : `${assemblyContent.correctFeedback} ${templateBase}-${candidateBase} 有 ${evaluation.hydrogenBondCount} 条氢键示意线。`,
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
      message: assemblyContent.initialFeedback,
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
      message: assemblyContent.invalidBaseFeedback,
    })
  }

  const showNextHint = () => {
    const nextEmptySlot = placedBases.findIndex((base) => base === null)

    if (nextEmptySlot === -1) {
      setFeedback({
        tone: 'success',
        message: assemblyContent.completeFeedback,
      })
      return
    }

    const templateBase = templateBases[nextEmptySlot]
    const expectedBase = getComplementBase(templateBase)
    setHintSlot(nextEmptySlot)
    setFeedback({
      tone: 'neutral',
      message: `提示：第 ${nextEmptySlot + 1} 位模板碱基是 ${templateBase}，应选择 ${expectedBase}。`,
    })
  }

  const buildHelix = () => {
    if (assembledSequence.length === 0) {
      setFeedback({
        tone: 'error',
        message: assemblyContent.emptyBuildFeedback,
      })
      return
    }

    setFeedback({
      tone: 'success',
      message: assemblyContent.buildFeedback,
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
          <p className="eyebrow">拼装模式</p>
          <h2 id="assembly-title">{assemblyContent.title}</h2>
        </div>
        <div className="assembly-progress" aria-label="拼装进度">
          <span>{completion.completedCount}</span>
          <span>/</span>
          <span>{completion.totalCount}</span>
        </div>
      </div>

      <p className="assembly-intro">{assemblyContent.intro}</p>

      <div className="assembly-progress-track" aria-hidden="true">
        <div
          className="assembly-progress-fill"
          style={{ width: `${completion.percentage}%` }}
        />
      </div>

      <div className="base-palette" aria-label="可拖拽碱基">
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
            <small>{baseContent[base].name}</small>
          </button>
        ))}
      </div>

      <div className="assembly-board-shell">
        <div className="assembly-board-head" aria-hidden="true">
          <span>位点</span>
          <span>模板链</span>
          <span>配对连接</span>
          <span>互补链</span>
          <span>结果</span>
        </div>

        <div className="assembly-board" role="list" aria-label="DNA 拼装槽位">
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
                  aria-label={`第 ${slotIndex + 1} 位互补槽，模板碱基 ${templateBase}`}
                >
                  {placedBase ?? '放入'}
                </button>
                <span className="assembly-pair-note">
                  {placedBase ? (
                    <>
                      <CheckCircle2 size={15} aria-hidden="true" />
                      {templateBase}-{placedBase} ·{' '}
                      {pairTypeContent.hydrogenBondCount} 条氢键
                    </>
                  ) : (
                    '等待互补碱基'
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <p className={`assembly-feedback is-${feedback.tone}`} role="status">
        {feedback.message}
      </p>

      <div className="assembly-actions">
        <button type="button" className="control-button" onClick={buildHelix}>
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>形成双螺旋</span>
        </button>
        <button type="button" className="control-button" onClick={showNextHint}>
          <HelpCircle size={18} aria-hidden="true" />
          <span>提示下一位</span>
        </button>
        <button
          type="button"
          className="control-button"
          onClick={() => resetAssembly()}
        >
          <RotateCcw size={18} aria-hidden="true" />
          <span>重置拼装</span>
        </button>
        <button type="button" className="control-button" onClick={switchChallenge}>
          <Shuffle size={18} aria-hidden="true" />
          <span>换一组序列</span>
        </button>
      </div>
    </section>
  )
}
