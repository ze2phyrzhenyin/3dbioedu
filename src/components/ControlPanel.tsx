import { BadgeCheck, Dna, Link2, RotateCcw, Split, Tag } from 'lucide-react'

import { localize, uiText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { ViewOptions } from '../types'

interface ControlPanelProps {
  options: ViewOptions
  onOptionsChange: (options: ViewOptions) => void
  onResetView: () => void
}

interface ToggleButtonProps {
  active: boolean
  label: string
  icon: React.ReactNode
  onClick: () => void
}

function ToggleButton({ active, label, icon, onClick }: ToggleButtonProps) {
  return (
    <button
      type="button"
      className={`control-button ${active ? 'is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function ControlPanel({
  options,
  onOptionsChange,
  onResetView,
}: ControlPanelProps) {
  const { language } = useLanguage()

  const toggleOption = (key: keyof ViewOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    })
  }

  return (
    <section className="panel control-panel" aria-labelledby="controls-title">
      <div className="panel-heading">
        <p className="eyebrow">{localize(uiText.controls.eyebrow, language)}</p>
        <h2 id="controls-title">
          {localize(uiText.controls.title, language)}
        </h2>
      </div>

      <div className="control-grid">
        <button type="button" className="control-button" onClick={onResetView}>
          <RotateCcw size={18} aria-hidden="true" />
          <span>{localize(uiText.controls.resetView, language)}</span>
        </button>

        <ToggleButton
          active={options.showLabels}
          label={localize(uiText.controls.showLabels, language)}
          icon={<Tag size={18} aria-hidden="true" />}
          onClick={() => toggleOption('showLabels')}
        />

        <ToggleButton
          active={options.highlightPairs}
          label={localize(uiText.controls.highlightPairs, language)}
          icon={<BadgeCheck size={18} aria-hidden="true" />}
          onClick={() => toggleOption('highlightPairs')}
        />

        <ToggleButton
          active={options.showBackbone}
          label={localize(uiText.controls.showBackbone, language)}
          icon={<Dna size={18} aria-hidden="true" />}
          onClick={() => toggleOption('showBackbone')}
        />

        <ToggleButton
          active={options.showHydrogenBonds}
          label={localize(uiText.controls.showHydrogenBonds, language)}
          icon={<Link2 size={18} aria-hidden="true" />}
          onClick={() => toggleOption('showHydrogenBonds')}
        />

        <ToggleButton
          active={options.splitOpen}
          label={localize(uiText.controls.splitOpen, language)}
          icon={<Split size={18} aria-hidden="true" />}
          onClick={() => toggleOption('splitOpen')}
        />
      </div>
    </section>
  )
}
