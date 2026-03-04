'use client'

import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import { Cloud } from 'lucide-react'

export default function SignInPrompt() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) return null

  return (
    <div className="zen-card p-4 flex items-center gap-3">
      <Cloud className="w-5 h-5 text-zen-water-500 flex-shrink-0" />
      <p className="text-sm text-zen-ink-600 flex-1">
        <Link href="/sign-in" className="text-zen-moss-600 hover:underline font-medium">
          Sign in
        </Link>
        {' '}to sync your garden across devices.
      </p>
    </div>
  )
}
