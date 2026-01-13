'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import WizardStep1Welcome from './WizardStep1Welcome'
import WizardStep2BasicInfo from './WizardStep2BasicInfo'
import WizardStep3AreaSetup from './WizardStep3AreaSetup'
import WizardStep4Complete from './WizardStep4Complete'
import { AreaKind } from '@/types/unified-allotment'

interface SetupWizardProps {
  onComplete: (data: WizardData) => void
  onSkip: () => void
}

export interface WizardData {
  allotmentName: string
  allotmentLocation: string
  areas: {
    id: string
    name: string
    kind: AreaKind
    width?: number
    length?: number
  }[]
}

export default function SetupWizard({ onComplete, onSkip }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    allotmentName: '',
    allotmentLocation: '',
    areas: []
  })

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleFinish = () => {
    onComplete(wizardData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zen-stone-200 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-display text-zen-ink-800">Setup Wizard</h1>
            {/* Progress Indicator */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all ${
                    step === currentStep
                      ? 'w-8 bg-zen-moss-600'
                      : step < currentStep
                      ? 'w-4 bg-zen-moss-400'
                      : 'w-4 bg-zen-stone-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <button
              onClick={onSkip}
              className="p-2 text-zen-stone-400 hover:text-zen-stone-600 hover:bg-zen-stone-100 rounded-zen transition"
              title="Skip setup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {currentStep === 1 && (
            <WizardStep1Welcome
              onNext={handleNext}
              onSkip={onSkip}
            />
          )}

          {currentStep === 2 && (
            <WizardStep2BasicInfo
              allotmentName={wizardData.allotmentName}
              allotmentLocation={wizardData.allotmentLocation}
              onAllotmentNameChange={(name) => setWizardData(prev => ({ ...prev, allotmentName: name }))}
              onAllotmentLocationChange={(location) => setWizardData(prev => ({ ...prev, allotmentLocation: location }))}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <WizardStep3AreaSetup
              areas={wizardData.areas}
              onAreasChange={(areas) => setWizardData(prev => ({ ...prev, areas }))}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <WizardStep4Complete
              onFinish={handleFinish}
              areasCount={wizardData.areas.length}
            />
          )}
        </div>
      </div>
    </div>
  )
}
