import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
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
        <header className="bg-primary-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">🌱 Community Allotment</h1>
              <div className="space-x-4">
                <Link href="/" className="hover:text-primary-200">Home</Link>
                <Link href="/announcements" className="hover:text-primary-200">Announcements</Link>
                <Link href="/calendar" className="hover:text-primary-200">Calendar</Link>
                <Link href="/ai-advisor" className="hover:text-primary-200">Plant Advisor</Link>
                <Link href="/admin" className="hover:text-primary-200">Admin</Link>
              </div>
            </nav>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2025 Community Allotment Association. Growing together! 🌿</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
