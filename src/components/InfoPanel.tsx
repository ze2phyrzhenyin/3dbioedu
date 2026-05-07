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
          <p className="eyebrow">信息</p>
          <h2 id="info-title">碱基说明</h2>
        </div>
        <p className="empty-state">点击模型中的碱基查看配对关系。</p>
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
        <p className="eyebrow">信息</p>
        <h2 id="info-title">碱基说明</h2>
      </div>

      <dl className="info-list">
        <div>
          <dt>当前碱基</dt>
          <dd>
            {selectedBaseContent.name} ({base})
          </dd>
        </div>
        <div>
          <dt>配对关系</dt>
          <dd>
            {pair.base} pairs with {pair.complement}
          </dd>
        </div>
        <div>
          <dt>碱基对</dt>
          <dd>
            {pair.pairLabel}，属于 {pairTypeContent.label} 配对
          </dd>
        </div>
        <div>
          <dt>氢键示意数</dt>
          <dd>{pairTypeContent.hydrogenBondCount} 条</dd>
        </div>
        <div>
          <dt>课堂解释</dt>
          <dd>{selectedBaseContent.explanation}</dd>
        </div>
        <div>
          <dt>配对原则</dt>
          <dd>{pairTypeContent.explanation}</dd>
        </div>
      </dl>

      <p className="science-note">{modelNotes.simplified}</p>
      <p className="science-note">{modelNotes.hydrogenBond}</p>
      <p className="science-note">{modelNotes.geometryBasis}</p>
    </section>
  )
}
