'use client'

import { Download, Trash2 } from 'lucide-react'
import {
  getAnalyticsSummary,
  exportAnalytics,
  type AnalyticsEvent,
} from '@/lib/analytics'

interface AnalyticsViewerProps {
  onClearClick: () => void
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleExportAnalytics() {
  const json = exportAnalytics()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AnalyticsViewer({ onClearClick }: AnalyticsViewerProps) {
  const summary = getAnalyticsSummary()

  return (
    <div className="mt-4 space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Event Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Total Events</p>
            <p className="text-lg font-semibold text-gray-900">{summary.totalEvents}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Storage</p>
            <p className="text-sm text-gray-700">Last 100 events</p>
          </div>
        </div>

        {/* Category breakdown */}
        {Object.keys(summary.categoryBreakdown).length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-2">By Category</p>
            <div className="space-y-1">
              {Object.entries(summary.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{category}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent events */}
      {summary.recentEvents.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Events</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {summary.recentEvents.map((event: AnalyticsEvent, idx: number) => (
              <div key={idx} className="text-xs flex items-center gap-2">
                <span className="text-gray-400 w-24 shrink-0">{formatTimestamp(event.timestamp)}</span>
                <span className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700 capitalize">{event.category}</span>
                <span className="text-gray-600">{event.action}</span>
                {event.label && (
                  <span className="text-gray-500 truncate">({event.label})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleExportAnalytics}
          disabled={summary.totalEvents === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3 h-3" />
          Export JSON
        </button>
        <button
          onClick={onClearClick}
          disabled={summary.totalEvents === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>
    </div>
  )
}
