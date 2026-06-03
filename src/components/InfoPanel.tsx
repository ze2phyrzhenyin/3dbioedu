import { baseContent, modelNotes, pairContent } from '../data/scienceContent'
import type { DnaSelection } from '../types'

interface InfoPanelProps {
  selection: DnaSelection | null
}

export function InfoPanel({ selection }: InfoPanelProps) {
  if (!selection) {
    return (
      <section className="panel info-panel" aria-labelledby="info-title">
        <div className="panel-heading">
          <p className="eyebrow">信息 / Informations</p>
          <h2 id="info-title">碱基说明 / Description des bases</h2>
        </div>
        <p className="empty-state">
          点击模型中的碱基查看配对关系。 / Cliquez sur une base du modèle pour
          voir son appariement.
        </p>
        <p className="science-note">{modelNotes.simplified}</p>
        <p className="science-note">{modelNotes.geometryBasis}</p>
      </section>
    )
  }

  const { pair, base } = selection
  const selectedBaseContent = baseContent[base]
  const pairTypeContent = pairContent[pair.pairType]

  return (
    <section className="panel info-panel" aria-labelledby="info-title">
      <div className="panel-heading">
        <p className="eyebrow">信息 / Informations</p>
        <h2 id="info-title">碱基说明 / Description des bases</h2>
      </div>

      <dl className="info-list">
        <div>
          <dt>当前碱基 / Base sélectionnée</dt>
          <dd>
            {selectedBaseContent.name} ({base})
          </dd>
        </div>
        <div>
          <dt>配对关系 / Appariement</dt>
          <dd>
            {pair.base} 与 {pair.complement} 配对 / {pair.base} s'apparie avec{' '}
            {pair.complement}
          </dd>
        </div>
        <div>
          <dt>碱基对 / Paire de bases</dt>
          <dd>
            {pair.pairLabel}，属于 {pairTypeContent.label} 配对 /{' '}
            {pair.pairLabel}, appariement {pairTypeContent.label}
          </dd>
        </div>
        <div>
          <dt>氢键示意数 / Liaisons H schématiques</dt>
          <dd>{pairTypeContent.hydrogenBondCount} 条 / {pairTypeContent.hydrogenBondCount}</dd>
        </div>
        <div>
          <dt>课堂解释 / Explication</dt>
          <dd>{selectedBaseContent.explanation}</dd>
        </div>
        <div>
          <dt>配对原则 / Principe d'appariement</dt>
          <dd>{pairTypeContent.explanation}</dd>
        </div>
      </dl>

      <p className="science-note">{modelNotes.simplified}</p>
      <p className="science-note">{modelNotes.hydrogenBond}</p>
      <p className="science-note">{modelNotes.geometryBasis}</p>
    </section>
  )
}
