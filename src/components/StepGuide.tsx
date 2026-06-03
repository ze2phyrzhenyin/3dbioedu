import { localize, stepGuideContent, uiText } from '../data/scienceContent'
import { useLanguage } from '../languageContext'
import type { StepId } from '../types'

interface StepGuideProps {
  currentStep: StepId
  onStepChange: (step: StepId) => void
}

export function StepGuide({ currentStep, onStepChange }: StepGuideProps) {
  const { language } = useLanguage()
  const currentStepContent = stepGuideContent.find(
    (step) => step.id === currentStep,
  )

  return (
    <section className="panel step-guide" aria-labelledby="step-guide-title">
      <div className="panel-heading">
        <p className="eyebrow">
          {localize(uiText.stepGuide.eyebrow, language)}
        </p>
        <h2 id="step-guide-title">
          {localize(uiText.stepGuide.title, language)}
        </h2>
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
            <span className="step-index">
              {localize(uiText.stepGuide.stepPrefix, language)} {step.id}
            </span>
            <span>{localize(step.title, language)}</span>
          </button>
        ))}
      </div>

      {currentStepContent ? (
        <p className="step-description">
          {localize(currentStepContent.description, language)}
        </p>
      ) : null}
    </section>
  )
}
