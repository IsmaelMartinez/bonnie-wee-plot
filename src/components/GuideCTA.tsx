import Link from 'next/link'
import { ArrowRight, Info, LucideIcon } from 'lucide-react'

interface GuideCTAProps {
  icon: LucideIcon
  title: string
  description: string
  bulletPoints: string[]
  buttonText: string
  gradientFrom?: string
  gradientTo?: string
}

export default function GuideCTA({
  icon: Icon,
  title,
  description,
  bulletPoints,
  buttonText,
  gradientFrom = 'from-green-600',
  gradientTo = 'to-emerald-600'
}: GuideCTAProps) {
  return (
    <section className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-lg p-8 text-white text-center`}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 mr-3" />
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        <p className="text-lg mb-6 text-green-100">{description}</p>
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Info className="w-5 h-5 text-green-200 mr-2" />
            <span className="text-green-200 font-medium">Ask Aitor about:</span>
          </div>
          <ul className="text-sm text-green-100 space-y-1">
            {bulletPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
        <Link 
          href="/ai-advisor" 
          className="inline-flex items-center bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
        >
          {buttonText}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    </section>
  )
}







