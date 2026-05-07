import { stepGuideContent } from '../data/scienceContent'
import type { StepId } from '../types'

interface StepGuideProps {
  currentStep: StepId
  onStepChange: (step: StepId) => void
}

export function StepGuide({ currentStep, onStepChange }: StepGuideProps) {
  const currentStepContent = stepGuideContent.find(
    (step) => step.id === currentStep,
  )

  return (
    <section className="panel step-guide" aria-labelledby="step-guide-title">
      <div className="panel-heading">
        <p className="eyebrow">讲解模式</p>
        <h2 id="step-guide-title">分步观察</h2>
      </div>

      <div className="step-list" role="list">
        {stepGuideContent.map((step) => (
          <button
            type="button"
            key={step.id}
            className={`step-button ${currentStep === step.id ? 'is-active' : ''}`}
            aria-pressed={currentStep === step.id}
            onClick={() => onStepChange(step.id)}
          >
            <span className="step-index">Step {step.id}</span>
            <span>{step.title}</span>
          </button>
        ))}
      </div>

      {currentStepContent ? (
        <p className="step-description">{currentStepContent.description}</p>
      ) : null}
    </section>
  )
}
