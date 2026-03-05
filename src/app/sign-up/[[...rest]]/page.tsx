import { redirect } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'

const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default function SignUpPage() {
  if (!isClerkConfigured) {
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
