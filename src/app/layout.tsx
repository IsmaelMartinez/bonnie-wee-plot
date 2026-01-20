import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import ErrorBoundaryProvider from '@/components/ErrorBoundaryProvider'
import StorageWarningBanner from '@/components/ui/StorageWarningBanner'
import OfflineIndicator from '@/components/ui/OfflineIndicator'
import InstallPrompt from '@/components/ui/InstallPrompt'
import { WebVitalsReporter } from '@/components/web-vitals'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bonnie Wee Plot',
  description: 'Plan your Scottish garden, track plantings across seasons, and get AI-powered growing advice',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <OfflineIndicator />
        <StorageWarningBanner />
        <Navigation />
        <main id="main-content" className="min-h-screen bg-gray-50" tabIndex={-1}>
          <ErrorBoundaryProvider>
            {children}
          </ErrorBoundaryProvider>
        </main>
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2025 Bonnie Wee Plot. Growing despite the weather! 🌿🏴󠁧󠁢󠁳󠁣󠁴󠁿</p>
          </div>
        </footer>
        <InstallPrompt />
        <WebVitalsReporter />
      </body>
    </html>
  )
}
