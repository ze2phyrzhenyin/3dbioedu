import {
  baseContent,
  localize,
  modelNotes,
  pairContent,
  uiText,
} from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { DnaSelection } from '../types'

interface InfoPanelProps {
  selection: DnaSelection | null
}

export function InfoPanel({ selection }: InfoPanelProps) {
  const { language } = useLanguage()

  if (!selection) {
    return (
      <section className="panel info-panel" aria-labelledby="info-title">
        <div className="panel-heading">
          <p className="eyebrow">{localize(uiText.info.eyebrow, language)}</p>
          <h2 id="info-title">{localize(uiText.info.title, language)}</h2>
        </div>
        <p className="empty-state">
          {localize(uiText.info.emptyState, language)}
        </p>
        <p className="science-note">
          {localize(modelNotes.simplified, language)}
        </p>
        <p className="science-note">
          {localize(modelNotes.geometryBasis, language)}
        </p>
      </section>
    )
  }

  const { pair, base } = selection
  const selectedBaseContent = baseContent[base]
  const pairTypeContent = pairContent[pair.pairType]

  return (
    <section className="panel info-panel" aria-labelledby="info-title">
      <div className="panel-heading">
        <p className="eyebrow">{localize(uiText.info.eyebrow, language)}</p>
        <h2 id="info-title">{localize(uiText.info.title, language)}</h2>
      </div>

      <dl className="info-list">
        <div>
          <dt>{localize(uiText.info.currentBase, language)}</dt>
          <dd>
            {localize(selectedBaseContent.name, language)} ({base})
          </dd>
        </div>
        <div>
          <dt>{localize(uiText.info.pairing, language)}</dt>
          <dd>
            {language === 'fr'
              ? `${pair.base} s'apparie avec ${pair.complement}`
              : `${pair.base} 与 ${pair.complement} 配对`}
          </dd>
        </div>
        <div>
          <dt>{localize(uiText.info.basePair, language)}</dt>
          <dd>
            {language === 'fr'
              ? `${pair.pairLabel}, appariement ${pairTypeContent.label}`
              : `${pair.pairLabel}，属于 ${pairTypeContent.label} 配对`}
          </dd>
        </div>
        <div>
          <dt>{localize(uiText.info.hydrogenBondCount, language)}</dt>
          <dd>
            {language === 'fr'
              ? pairTypeContent.hydrogenBondCount
              : `${pairTypeContent.hydrogenBondCount} 条`}
          </dd>
        </div>
        <div>
          <dt>{localize(uiText.info.classroomExplanation, language)}</dt>
          <dd>{localize(selectedBaseContent.explanation, language)}</dd>
        </div>
        <div>
          <dt>{localize(uiText.info.pairingPrinciple, language)}</dt>
          <dd>{localize(pairTypeContent.explanation, language)}</dd>
        </div>
      </dl>

      <p className="science-note">{localize(modelNotes.simplified, language)}</p>
      <p className="science-note">
        {localize(modelNotes.hydrogenBond, language)}
      </p>
      <p className="science-note">
        {localize(modelNotes.geometryBasis, language)}
      </p>
    </section>
  )
}
