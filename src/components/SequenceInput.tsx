import type { ChangeEvent } from 'react'

import { modelNotes } from '../data/scienceContent'
import type { SequenceValidationResult } from '../utils/dna'

interface SequenceInputProps {
  value: string
  activeSequence: string
  displayedSequence: string
  complementSequence: string
  isTruncated: boolean
  validation: SequenceValidationResult
  onChange: (value: string) => void
}

export function SequenceInput({
  value,
  activeSequence,
  displayedSequence,
  complementSequence,
  isTruncated,
  validation,
  onChange,
}: SequenceInputProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  return (
    <section className="panel sequence-panel" aria-labelledby="sequence-title">
      <div className="panel-heading">
        <p className="eyebrow">学生互动 / Interaction élève</p>
        <h2 id="sequence-title">互补链生成 / Générer le brin complémentaire</h2>
      </div>

      <label className="field-label" htmlFor="dna-sequence">
        输入 DNA 序列 / Saisir une séquence ADN
      </label>
      <textarea
        id="dna-sequence"
        value={value}
        rows={4}
        spellCheck={false}
        className={`sequence-input ${validation.isValid ? '' : 'has-error'}`}
        onChange={handleChange}
      />

      {!validation.isValid ? (
        <p className="form-error" role="alert">
          {modelNotes.invalidSequence}
        </p>
      ) : null}

      <div className="sequence-output">
        <span>互补链 / Brin complémentaire</span>
        <output>
          {validation.isValid
            ? complementSequence || '空序列 / Séquence vide'
            : '-'}
        </output>
      </div>

      <div className="sequence-output">
        <span>模型展示 / Séquence affichée</span>
        <output>{displayedSequence || '空序列 / Séquence vide'}</output>
      </div>

      {isTruncated ? (
        <p className="form-notice">{modelNotes.sequenceLimit}</p>
      ) : null}

      {!validation.isValid ? (
        <p className="form-notice">
          模型保留上一条有效序列：{activeSequence} / Le modèle conserve la
          dernière séquence valide: {activeSequence}
        </p>
      ) : null}
    </section>
  )
}
