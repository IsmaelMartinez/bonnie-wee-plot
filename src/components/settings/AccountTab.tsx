'use client'

import { useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Cloud, Download, Trash2, Shield } from 'lucide-react'

export default function AccountTab() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/account')
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'bonnie-wee-plot-export.json'
      a.click()
      URL.revokeObjectURL(url)
      setFeedback('Data exported successfully')
    } catch {
      setFeedback('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setIsDeleting(true)
    try {
      const response = await fetch('/api/account', { method: 'DELETE' })
      if (!response.ok) throw new Error('Deletion failed')

      localStorage.removeItem('allotment-unified-data')
      await signOut()
    } catch {
      setFeedback('Deletion failed. Please try again.')
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Account info */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Cloud className="w-5 h-5 text-zen-water-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Cloud Account</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Signed in as {user?.primaryEmailAddress?.emailAddress || 'unknown'}.
          Your garden data syncs automatically across devices.
        </p>
      </section>

      {/* Export */}
      <section className="pt-6 border-t border-zen-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-zen-moss-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Export Data</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Download all your garden data as a JSON file.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="zen-btn-secondary min-h-[44px] disabled:opacity-50"
        >
          {isExporting ? 'Exporting...' : 'Export My Data'}
        </button>
      </section>

      {/* Delete Account */}
      <section className="pt-6 border-t border-zen-stone-200">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-zen-kitsune-600" />
          <h2 className="text-lg font-medium text-zen-ink-700">Delete Account</h2>
        </div>
        <div className="bg-zen-kitsune-50 border border-zen-kitsune-200 rounded-zen p-3 mb-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-zen-kitsune-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-zen-kitsune-800">
              This permanently deletes your cloud data and account. Local data on this device will also be removed. This cannot be undone.
            </p>
          </div>
        </div>
        {confirmDelete ? (
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="zen-btn-primary bg-zen-kitsune-600 hover:bg-zen-kitsune-700 min-h-[44px] disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="zen-btn-secondary min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            className="zen-btn-secondary text-zen-kitsune-600 border-zen-kitsune-300 hover:bg-zen-kitsune-50 min-h-[44px]"
          >
            Delete My Account
          </button>
        )}
      </section>

      {/* Feedback */}
      {feedback && (
        <p className="text-sm text-zen-ink-600 bg-zen-stone-100 rounded-zen px-3 py-2">{feedback}</p>
      )}
    </div>
  )
}
