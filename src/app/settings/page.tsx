'use client'

import { ShareDialog } from '@/components/share/ShareDialog'
import { useAllotment } from '@/hooks/useAllotment'
import Link from 'next/link'
import { Download, ArrowRight } from 'lucide-react'

export default function SettingsPage() {
  const { data, flushSave } = useAllotment()

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-display text-zen-ink-800 mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-zen-ink-700 mb-4">Share Allotment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Share your allotment data with another device. The share link expires after 5 minutes for security.
        </p>
        <ShareDialog data={data} flushSave={flushSave} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-medium text-zen-ink-700 mb-4">Receive Allotment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Import allotment data shared from another device by scanning a QR code or entering a code.
        </p>
        <Link
          href="/receive"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <Download className="w-4 h-4" />
          Receive Data
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  )
}
