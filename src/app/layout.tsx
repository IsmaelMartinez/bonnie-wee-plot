import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/AuthProvider'
import Navigation from '@/components/Navigation'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Community Allotment Association',
  description: 'Manage your allotment community with announcements, tips, and AI-powered plant advice',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider session={null}>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-4 text-center">
              <p>&copy; 2025 Community Allotment Association. Growing together! 🌿</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
