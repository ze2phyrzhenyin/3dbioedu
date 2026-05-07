import { BadgeCheck, Dna, Link2, RotateCcw, Split, Tag } from 'lucide-react'

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
  const toggleOption = (key: keyof ViewOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    })
  }

  return (
    <section className="panel control-panel" aria-labelledby="controls-title">
      <div className="panel-heading">
        <p className="eyebrow">控制</p>
        <h2 id="controls-title">模型显示</h2>
      </div>

      <div className="control-grid">
        <button type="button" className="control-button" onClick={onResetView}>
          <RotateCcw size={18} aria-hidden="true" />
          <span>重置视角</span>
        </button>

        <ToggleButton
          active={options.showLabels}
          label="显示标签"
          icon={<Tag size={18} aria-hidden="true" />}
          onClick={() => toggleOption('showLabels')}
        />

        <ToggleButton
          active={options.highlightPairs}
          label="高亮互补配对"
          icon={<BadgeCheck size={18} aria-hidden="true" />}
          onClick={() => toggleOption('highlightPairs')}
        />

        <ToggleButton
          active={options.showBackbone}
          label="显示骨架"
          icon={<Dna size={18} aria-hidden="true" />}
          onClick={() => toggleOption('showBackbone')}
        />

        <ToggleButton
          active={options.showHydrogenBonds}
          label="显示氢键"
          icon={<Link2 size={18} aria-hidden="true" />}
          onClick={() => toggleOption('showHydrogenBonds')}
        />

        <ToggleButton
          active={options.splitOpen}
          label="分离双链"
          icon={<Split size={18} aria-hidden="true" />}
          onClick={() => toggleOption('splitOpen')}
        />
      </div>
    </section>
  )
}
