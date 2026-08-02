import {
  assemblyContent,
  localize,
  pairContent,
  uiText,
} from '../data/scienceContent'
import { useLanguage } from '../languageContext'

export function AssemblyHelpPanel() {
  const { language } = useLanguage()

  return (
    <section className="panel assembly-help" aria-labelledby="assembly-help-title">
      <div className="panel-heading">
        <p className="eyebrow">
          {localize(uiText.assembly.helpEyebrow, language)}
        </p>
        <h2 id="assembly-help-title">
          {localize(assemblyContent.pairingRuleTitle, language)}
        </h2>
      </div>

      <p>{localize(assemblyContent.pairingRule, language)}</p>
      <p>{localize(assemblyContent.structureRule, language)}</p>

      <dl className="pairing-rule-list">
        <div>
          <dt>A-T</dt>
          <dd>
            {`${pairContent['A-T'].hydrogenBondCount} ${localize(
              uiText.assembly.hydrogenBondLines,
              language,
            )}`}
          </dd>
        </div>
        <div>
          <dt>C-G</dt>
          <dd>
            {`${pairContent['C-G'].hydrogenBondCount} ${localize(
              uiText.assembly.hydrogenBondLines,
              language,
            )}`}
          </dd>
        </div>
      </dl>
    </section>
  )
}
