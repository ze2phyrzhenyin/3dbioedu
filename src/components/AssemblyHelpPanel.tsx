import { assemblyContent, pairContent } from '../data/scienceContent'

export function AssemblyHelpPanel() {
  return (
    <section className="panel assembly-help" aria-labelledby="assembly-help-title">
      <div className="panel-heading">
        <p className="eyebrow">课堂要点 / Points clés</p>
        <h2 id="assembly-help-title">{assemblyContent.pairingRuleTitle}</h2>
      </div>

      <p>{assemblyContent.pairingRule}</p>
      <p>{assemblyContent.structureRule}</p>

      <dl className="pairing-rule-list">
        <div>
          <dt>A-T</dt>
          <dd>
            {pairContent['A-T'].hydrogenBondCount} 条氢键示意线 /{' '}
            {pairContent['A-T'].hydrogenBondCount} liaisons H schématiques
          </dd>
        </div>
        <div>
          <dt>C-G</dt>
          <dd>
            {pairContent['C-G'].hydrogenBondCount} 条氢键示意线 /{' '}
            {pairContent['C-G'].hydrogenBondCount} liaisons H schématiques
          </dd>
        </div>
      </dl>
    </section>
  )
}
