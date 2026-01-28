'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Grid3X3, MessageCircle, Sprout, ArrowRight, Check } from 'lucide-react'
import Dialog from '@/components/ui/Dialog'

type OnboardingPath = 'explore' | 'plan' | 'ask'

interface OnboardingWizardProps {
  isOpen: boolean
  onComplete: () => void
}

/**
 * Onboarding Wizard - 3-screen welcome experience for new users
 *
 * Screen 1: Welcome with three paths (explore/plan/ask)
 * Screen 2: First meaningful action guidance based on chosen path
 * Screen 3: Success confirmation with next steps
 */
export default function OnboardingWizard({ isOpen, onComplete }: OnboardingWizardProps) {
  const router = useRouter()
  const [screen, setScreen] = useState<1 | 2 | 3>(1)
  const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null)

  const handlePathSelect = (path: OnboardingPath) => {
    setSelectedPath(path)
    setScreen(2)
  }

  const handleActionComplete = () => {
    setScreen(3)
  }

  const handleFinish = () => {
    onComplete()
    // Navigate based on the path they chose
    if (selectedPath === 'explore') {
      router.push('/this-month')
    } else if (selectedPath === 'plan') {
      router.push('/allotment')
    } else if (selectedPath === 'ask') {
      router.push('/ai-advisor')
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleSkip}
      title={screen === 1 ? 'Welcome to Bonnie Wee Plot' : screen === 2 ? 'Getting Started' : 'You\'re Ready!'}
      maxWidth="lg"
      showCloseButton={screen === 1}
      closeOnOutsideClick={false}
    >
      {screen === 1 && <WelcomeScreen onPathSelect={handlePathSelect} onSkip={handleSkip} />}
      {screen === 2 && selectedPath && (
        <ActionScreen path={selectedPath} onContinue={handleActionComplete} onBack={() => setScreen(1)} />
      )}
      {screen === 3 && <SuccessScreen path={selectedPath!} onFinish={handleFinish} />}
    </Dialog>
  )
}

// ============ SCREEN 1: WELCOME ============

interface WelcomeScreenProps {
  onPathSelect: (path: OnboardingPath) => void
  onSkip: () => void
}

function WelcomeScreen({ onPathSelect, onSkip }: WelcomeScreenProps) {
  return (
    <div className="space-y-6">
      <p className="text-zen-stone-600">
        Your Scottish garden planning companion. What would you like to do first?
      </p>

      <div className="space-y-3">
        <PathCard
          icon={Calendar}
          title="Show me what to grow"
          description="See what's in season for Scottish gardens right now"
          onClick={() => onPathSelect('explore')}
        />
        <PathCard
          icon={Grid3X3}
          title="I have a plot to plan"
          description="Set up your allotment beds and start planning"
          onClick={() => onPathSelect('plan')}
        />
        <PathCard
          icon={MessageCircle}
          title="I just want to ask"
          description="Chat with Aitor, your AI gardening advisor"
          onClick={() => onPathSelect('ask')}
        />
      </div>

      <button
        onClick={onSkip}
        className="w-full text-sm text-zen-stone-400 hover:text-zen-stone-600 transition-colors py-2"
      >
        Skip for now
      </button>
    </div>
  )
}

interface PathCardProps {
  icon: typeof Calendar
  title: string
  description: string
  onClick: () => void
}

function PathCard({ icon: Icon, title, description, onClick }: PathCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl border-2 border-zen-stone-200 hover:border-zen-moss-400 hover:bg-zen-moss-50 transition-all text-left group"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-zen-stone-100 group-hover:bg-zen-moss-100 transition-colors">
          <Icon className="w-5 h-5 text-zen-stone-500 group-hover:text-zen-moss-600 transition-colors" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-zen-ink-800 group-hover:text-zen-ink-900">{title}</h3>
          <p className="text-sm text-zen-stone-500 mt-0.5">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-zen-stone-300 group-hover:text-zen-moss-500 transition-colors mt-1" />
      </div>
    </button>
  )
}

// ============ SCREEN 2: ACTION GUIDANCE ============

interface ActionScreenProps {
  path: OnboardingPath
  onContinue: () => void
  onBack: () => void
}

function ActionScreen({ path, onContinue, onBack }: ActionScreenProps) {
  const content = getActionContent(path)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-zen-moss-100">
          <content.icon className="w-6 h-6 text-zen-moss-600" />
        </div>
        <div>
          <h3 className="font-medium text-zen-ink-800 text-lg">{content.title}</h3>
          <p className="text-zen-stone-600 mt-1">{content.description}</p>
        </div>
      </div>

      <div className="bg-zen-stone-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-zen-ink-700">What you&apos;ll find:</p>
        <ul className="space-y-2">
          {content.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zen-stone-600">
              <Sprout className="w-4 h-4 text-zen-moss-500 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {content.tip && (
        <div className="text-sm text-zen-stone-500 italic">
          Tip: {content.tip}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-zen-stone-600 hover:text-zen-ink-800 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="flex-1 px-4 py-2.5 bg-zen-moss-600 hover:bg-zen-moss-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          Got it, let&apos;s go
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function getActionContent(path: OnboardingPath) {
  switch (path) {
    case 'explore':
      return {
        icon: Calendar,
        title: 'Seasonal Calendar',
        description: 'Discover what thrives in Scottish gardens this month.',
        features: [
          'Plants suited to our climate and day length',
          'Sowing and harvesting windows for your area',
          'Tasks you should be doing right now',
        ],
        tip: 'Scotland\'s growing season is shorter but our long summer days make up for it!',
      }
    case 'plan':
      return {
        icon: Grid3X3,
        title: 'Your Allotment',
        description: 'Set up your beds and track what grows where.',
        features: [
          'Visual bed layout for your plot',
          'Crop rotation tracking across years',
          'Plan next season while harvesting this one',
        ],
        tip: 'Start with one bed. You can always add more later.',
      }
    case 'ask':
      return {
        icon: MessageCircle,
        title: 'Ask Aitor',
        description: 'Your AI gardening advisor, trained on Scottish growing conditions.',
        features: [
          'Personalised advice for your specific plot',
          'Pest and disease identification',
          'Companion planting suggestions',
        ],
        tip: 'Aitor knows about your allotment data and can give contextual advice.',
      }
  }
}

// ============ SCREEN 3: SUCCESS ============

interface SuccessScreenProps {
  path: OnboardingPath
  onFinish: () => void
}

function SuccessScreen({ path, onFinish }: SuccessScreenProps) {
  const nextSteps = getNextSteps(path)

  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-zen-moss-100 flex items-center justify-center">
        <Check className="w-8 h-8 text-zen-moss-600" />
      </div>

      <div>
        <h3 className="font-medium text-zen-ink-800 text-lg">All set!</h3>
        <p className="text-zen-stone-600 mt-1">
          Your garden journey begins now.
        </p>
      </div>

      <div className="bg-zen-stone-50 rounded-xl p-4 text-left">
        <p className="text-sm font-medium text-zen-ink-700 mb-3">Next steps:</p>
        <ul className="space-y-2">
          {nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zen-stone-600">
              <span className="w-5 h-5 rounded-full bg-zen-moss-100 text-zen-moss-600 flex items-center justify-center text-xs font-medium shrink-0">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onFinish}
        className="w-full px-4 py-3 bg-zen-moss-600 hover:bg-zen-moss-700 text-white rounded-lg font-medium transition-colors"
      >
        Start Exploring
      </button>
    </div>
  )
}

function getNextSteps(path: OnboardingPath): string[] {
  switch (path) {
    case 'explore':
      return [
        'Browse what\'s in season this month',
        'Add a planting to track your first crop',
        'Set up your beds when you\'re ready',
      ]
    case 'plan':
      return [
        'Add your first bed to the allotment layout',
        'Record a planting in that bed',
        'Check the calendar for sowing dates',
      ]
    case 'ask':
      return [
        'Ask Aitor about growing conditions',
        'Try uploading a photo for plant ID',
        'Come back to plan your plot anytime',
      ]
  }
}
