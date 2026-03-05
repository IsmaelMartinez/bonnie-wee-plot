import { redirect } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'

// Clerk is available via explicit keys or keyless mode (dev only)
const hasClerkKeys = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const isKeylessMode = !hasClerkKeys && process.env.NODE_ENV === 'development'
const clerkAvailable = hasClerkKeys || isKeylessMode

export default function SignUpPage() {
  if (!clerkAvailable) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-zen-stone-50 zen-texture flex items-center justify-center px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  )
}
