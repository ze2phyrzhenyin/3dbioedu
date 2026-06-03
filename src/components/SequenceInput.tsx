import type { ChangeEvent } from 'react'

import { localize, modelNotes, uiText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
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
  const { language } = useLanguage()

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value)
  }

  return (
    <section className="panel sequence-panel" aria-labelledby="sequence-title">
      <div className="panel-heading">
        <p className="eyebrow">
          {localize(uiText.sequence.eyebrow, language)}
        </p>
        <h2 id="sequence-title">
          {localize(uiText.sequence.title, language)}
        </h2>
      </div>

      <label className="field-label" htmlFor="dna-sequence">
        {localize(uiText.sequence.inputLabel, language)}
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
          {localize(modelNotes.invalidSequence, language)}
        </p>
      ) : null}

      <div className="sequence-output">
        <span>{localize(uiText.sequence.complement, language)}</span>
        <output>
          {validation.isValid
            ? complementSequence || localize(uiText.sequence.emptySequence, language)
            : '-'}
        </output>
      </div>

      <div className="sequence-output">
        <span>{localize(uiText.sequence.displayed, language)}</span>
        <output>
          {displayedSequence || localize(uiText.sequence.emptySequence, language)}
        </output>
      </div>

      {isTruncated ? (
        <p className="form-notice">
          {localize(modelNotes.sequenceLimit, language)}
        </p>
      ) : null}

      {!validation.isValid ? (
        <p className="form-notice">
          {localize(uiText.sequence.previousValid, language)} {activeSequence}
        </p>
      ) : null}
    </section>
  )
}
