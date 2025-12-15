'use client'

import { useState, useEffect } from 'react'
import { Truck, Package, Lightbulb, Calendar, Bell } from 'lucide-react'
import type { Announcement } from '@/types'

const typeIcons = {
  delivery: Truck,
  order: Package,
  tip: Lightbulb,
  event: Calendar
}

const typeColors = {
  delivery: 'bg-orange-100 border-orange-500 text-orange-800',
  order: 'bg-blue-100 border-blue-500 text-blue-800',
  tip: 'bg-green-100 border-green-500 text-green-800',
  event: 'bg-purple-100 border-purple-500 text-purple-800'
}

const typeLabels = {
  delivery: 'Delivery',
  order: 'Order',
  tip: 'Gardening Tip',
  event: 'Event'
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    if (filter === 'all') return true
    return announcement.type === filter
  })
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">📢 Community Announcements</h1>
        <p className="text-gray-600 mb-6">
          Stay up to date with the latest news, deliveries, orders, and gardening tips from your allotment community.
        </p>
        
        {/* Subscription Box */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-primary-600 mr-2" />
              <span className="text-primary-800 font-medium">Never miss an announcement!</span>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
              Subscribe to Notifications
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('delivery')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'delivery' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Deliveries
          </button>
          <button 
            onClick={() => setFilter('order')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'order' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Orders
          </button>
          <button 
            onClick={() => setFilter('tip')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'tip' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tips
          </button>
          <button 
            onClick={() => setFilter('event')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'event' 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading announcements...</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No announcements found.</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const IconComponent = typeIcons[announcement.type] || Bell // Fallback to Bell icon if undefined
            const colorClass = typeColors[announcement.type]
            return (
              <div key={announcement.id} data-testid="announcement-card" className="bg-white rounded-lg shadow-md border-l-4 border-l-gray-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${colorClass} mr-4`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span data-testid="announcement-type" className={`px-2 py-1 text-xs font-medium rounded-full border ${colorClass}`}>
                            {typeLabels[announcement.type]}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityColors[announcement.priority]}`}>
                            {announcement.priority.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">{announcement.title}</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{announcement.date}</div>
                      <div className="text-sm text-gray-600">by {announcement.author}</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed mb-4">{announcement.content}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        👍 Helpful (12)
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        💬 Comment
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                        📤 Share
                      </button>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      🔖 Save
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Load More Button */}
      <div className="text-center mt-8">
        <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition">
          Load More Announcements
        </button>
      </div>
    </div>
  )
}
