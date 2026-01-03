'use client'

import Link from 'next/link'
import { Grid3X3, Package, MessageCircle, Calendar } from 'lucide-react'

const ACTIONS = [
  {
    href: '/allotment',
    icon: Grid3X3,
    label: 'Allotment',
    description: 'View beds',
  },
  {
    href: '/seeds',
    icon: Package,
    label: 'Seeds',
    description: 'Manage stock',
  },
  {
    href: '/ai-advisor',
    icon: MessageCircle,
    label: 'Ask Aitor',
    description: 'Get advice',
  },
  {
    href: '/this-month',
    icon: Calendar,
    label: 'Calendar',
    description: 'What to do',
  },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group zen-card p-4 hover:shadow-zen-md transition-all duration-200 hover:-translate-y-0.5"
        >
          <action.icon
            className="w-5 h-5 mb-2 text-zen-stone-400 group-hover:text-zen-moss-600 transition-colors"
          />
          <h4 className="text-sm font-medium text-zen-ink-700 group-hover:text-zen-ink-900 transition-colors">
            {action.label}
          </h4>
          <p className="text-xs text-zen-stone-500 mt-0.5 hidden md:block">
            {action.description}
          </p>
        </Link>
      ))}
    </div>
  )
}
