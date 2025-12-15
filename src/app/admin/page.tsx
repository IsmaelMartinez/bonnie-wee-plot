'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Users, Bell, BarChart3, Settings, Loader2, X } from 'lucide-react'
import type { Announcement, AnnouncementFormData } from '@/types'

const stats = [
  { label: 'Total Users', value: '156', icon: Users, color: 'bg-blue-500' },
  { label: 'Active Subscriptions', value: '124', icon: Bell, color: 'bg-green-500' },
  { label: 'Announcements This Month', value: '12', icon: BarChart3, color: 'bg-purple-500' },
  { label: 'Avg. Engagement Rate', value: '78%', icon: Eye, color: 'bg-orange-500' }
]

const typeColors = {
  delivery: 'bg-orange-100 text-orange-800 border-orange-200',
  order: 'bg-blue-100 text-blue-800 border-blue-200',
  tip: 'bg-green-100 text-green-800 border-green-200',
  event: 'bg-purple-100 text-purple-800 border-purple-200'
}

const statusColors = {
  published: 'bg-green-100 text-green-800 border-green-200',
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-red-100 text-red-800 border-red-200'
}

export default function AdminPage() {
  
  const [activeTab, setActiveTab] = useState('announcements')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'tip',
    priority: 'low',
    date: new Date().toISOString().split('T')[0]
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/announcements')
      if (!response.ok) {
        throw new Error('Failed to fetch announcements')
      }
      const data = await response.json()
      setAnnouncements(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      // No fallback data - will show error state
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required'
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters'
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required'
    } else if (formData.content.length > 1000) {
      errors.content = 'Content must be less than 1000 characters'
    }
    
    if (!formData.date) {
      errors.date = 'Date is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setSubmitting(true)
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          author: 'Admin',
          isActive: true
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to create announcement')
      }
      
      // Reset form and close modal
      resetForm()
      setShowCreateModal(false)
      
      // Refresh announcements list
      await fetchAnnouncements()
      
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'An error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit announcement
  const handleEditAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !selectedAnnouncement) {
      return
    }
    
    setSubmitting(true)
    try {
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isActive: selectedAnnouncement.isActive
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to update announcement')
      }
      
      // Reset form and close modal
      resetForm()
      setShowEditModal(false)
      setSelectedAnnouncement(null)
      
      // Refresh announcements list
      await fetchAnnouncements()
      
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'An error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`/api/announcements/${selectedAnnouncement.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error ?? 'Failed to delete announcement')
      }
      
      // Close modal and refresh list
      setShowDeleteModal(false)
      setSelectedAnnouncement(null)
      await fetchAnnouncements()
      
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'An error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  // Open edit modal with announcement data
  const openEditModal = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      date: announcement.date
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  // Open delete modal
  const openDeleteModal = (announcement: any) => {
    setSelectedAnnouncement(announcement)
    setShowDeleteModal(true)
  }

  // Reset form helper
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'tip',
      priority: 'low',
      date: new Date().toISOString().split('T')[0]
    })
    setFormErrors({})
  }

  // Helper function to render table body content
  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-gray-500">Loading announcements...</span>
            </div>
          </td>
        </tr>
      )
    }

    if (error) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center">
            <div className="text-red-500">
              <p>Error loading announcements: {error}</p>
              <button 
                onClick={fetchAnnouncements}
                className="mt-2 text-primary-600 hover:text-primary-700 underline"
              >
                Try again
              </button>
            </div>
          </td>
        </tr>
      )
    }

    if (announcements.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            No announcements found
          </td>
        </tr>
      )
    }

    return announcements.map((announcement) => (
      <tr key={announcement.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span 
            data-testid={`type-badge-${announcement.type}`} 
            data-badge={announcement.type}
            className={`px-2 py-1 text-xs font-medium rounded-full border ${typeColors[announcement.type as keyof typeof typeColors]}`}
          >
            {announcement.type}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span 
            data-testid={`priority-badge-${announcement.priority ?? 'low'}`} 
            data-priority={announcement.priority ?? 'low'}
            className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityColors[(announcement.priority ?? 'low') as keyof typeof priorityColors]}`}
          >
            {announcement.priority ?? 'low'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span data-testid={`status-badge-${announcement.isActive ? 'published' : 'draft'}`} className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColors[announcement.isActive ? 'published' : 'draft' as keyof typeof statusColors]}`}>
            {announcement.isActive ? 'published' : 'draft'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {announcement.author}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {announcement.date}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" data-lucide="eye" />
              {announcement.views ?? 0}
            </span>
            <span className="flex items-center">
              👍 {announcement.reactions ?? 0}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => openEditModal(announcement)}
              data-testid="edit-button" 
              className="text-primary-600 hover:text-primary-700"
              title="Edit announcement"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button 
              onClick={() => openDeleteModal(announcement)}
              data-testid="delete-button" 
              className="text-red-600 hover:text-red-700"
              title="Delete announcement"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    ))
  }

  const renderAnnouncementsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Announcements</h2>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center"
          data-testid="new-announcement-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {renderTableBody()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderUsersTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Users</h2>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition">
          Export User List
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" role="table">
            <thead className="bg-gray-50">
              <tr>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th role="columnheader" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">John Smith</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">john.smith@email.com</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                    Member
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2025-06-01
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">sarah.johnson@email.com</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full border bg-purple-100 text-purple-800 border-purple-200">
                    Admin
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2025-05-15
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">Mike Wilson</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">mike.wilson@email.com</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                    Member
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  2025-06-10
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-200">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-primary-600 hover:text-primary-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Subscription Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">All Announcements</span>
              <span className="font-medium">124 users</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Deliveries Only</span>
              <span className="font-medium">89 users</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Events Only</span>
              <span className="font-medium">67 users</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Unsubscribed</span>
              <span className="font-medium text-red-600">32 users</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Emily Clark subscribed to all announcements</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">David Lee updated subscription preferences</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Lisa Brown joined the community</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tom Anderson unsubscribed from tips</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div>
      <h2 className="text-xl font-semibold mb-6">Platform Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-600">Send email notifications for new announcements</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">SMS Notifications</div>
                <div className="text-sm text-gray-600">Send SMS for urgent announcements</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-publish Seasonal Tips</div>
                <div className="text-sm text-gray-600">Automatically publish monthly gardening tips</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">AI Advisor Settings</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700 mb-2">
                AI Model Provider
              </label>
              <select id="ai-provider" className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>OpenAI GPT-4 (Plant Specialist)</option>
                <option>Anthropic Claude (Garden Expert)</option>
                <option>Custom Plant Model</option>
              </select>
            </div>
            <div>
              <label htmlFor="response-length" className="block text-sm font-medium text-gray-700 mb-2">
                Response Length
              </label>
              <select id="response-length" className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>Detailed (Recommended)</option>
                <option>Concise</option>
                <option>Brief</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Include Weather Data</div>
                <div className="text-sm text-gray-600">Use local weather in AI responses</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">Content Moderation</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto-approve Member Posts</div>
                <div className="text-sm text-gray-600">Automatically approve posts from verified members</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Profanity Filter</div>
                <div className="text-sm text-gray-600">Filter inappropriate language in announcements</div>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Manual Review Required</div>
                <div className="text-sm text-gray-600">All announcements require admin approval</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-4">System Configuration</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Default Timezone
              </label>
              <select id="timezone" className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option>GMT (Greenwich Mean Time)</option>
                <option>EST (Eastern Standard Time)</option>
                <option>PST (Pacific Standard Time)</option>
                <option>CET (Central European Time)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Maintenance Mode</div>
                <div className="text-sm text-gray-600">Put the system in maintenance mode</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Debug Logging</div>
                <div className="text-sm text-gray-600">Enable detailed system logs</div>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">🔧 Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage your allotment community platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const IconComponent = stat.icon
          return (
            <div key={`stat-${stat.label.replace(/\s+/g, '-').toLowerCase()}`} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color} text-white mr-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <div data-testid={`stat-${stat.label.replace(/\s+/g, '-').toLowerCase()}-value`} className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {[
              { id: 'announcements', label: 'Announcements', icon: Bell },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'announcements' && renderAnnouncementsTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="create-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Create New Announcement</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  data-testid="close-modal-button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-6" data-testid="create-announcement-form">
                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {formErrors.submit}
                  </div>
                )}

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    data-testid="title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter announcement title"
                    maxLength={100}
                  />
                  {formErrors.title && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{formData.title.length}/100 characters</p>
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    id="content"
                    data-testid="content-input"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.content ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter announcement content"
                    maxLength={1000}
                  />
                  {formErrors.content && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.content}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{formData.content.length}/1000 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      id="type"
                      data-testid="type-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="tip">Tip</option>
                      <option value="delivery">Delivery</option>
                      <option value="order">Order</option>
                      <option value="event">Event</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="priority"
                      data-testid="priority-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    data-testid="date-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.date && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.date}</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    disabled={submitting}
                    data-testid="cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="submit-button"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Announcement'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="edit-modal">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Edit Announcement</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedAnnouncement(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  data-testid="close-edit-modal-button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEditAnnouncement} className="space-y-6" data-testid="edit-announcement-form">
                {formErrors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {formErrors.submit}
                  </div>
                )}

                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    data-testid="edit-title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter announcement title"
                    maxLength={100}
                  />
                  {formErrors.title && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{formData.title.length}/100 characters</p>
                </div>

                <div>
                  <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <textarea
                    id="edit-content"
                    data-testid="edit-content-input"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.content ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter announcement content"
                    maxLength={1000}
                  />
                  {formErrors.content && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.content}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-1">{formData.content.length}/1000 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      id="edit-type"
                      data-testid="edit-type-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="tip">Tip</option>
                      <option value="delivery">Delivery</option>
                      <option value="order">Order</option>
                      <option value="event">Event</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      id="edit-priority"
                      data-testid="edit-priority-select"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date *
                  </label>
                  <input
                    type="date"
                    id="edit-date"
                    data-testid="edit-date-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      formErrors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.date && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.date}</p>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedAnnouncement(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                    disabled={submitting}
                    data-testid="edit-cancel-button"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="edit-submit-button"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Announcement'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="delete-modal">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Delete Announcement</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedAnnouncement(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  data-testid="close-delete-modal-button"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this announcement? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedAnnouncement.title}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedAnnouncement.content.substring(0, 100)}
                    {selectedAnnouncement.content.length > 100 ? '...' : ''}
                  </p>
                </div>
              </div>

              {formErrors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                  {formErrors.submit}
                </div>
              )}

              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedAnnouncement(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  disabled={submitting}
                  data-testid="delete-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAnnouncement}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="delete-confirm-button"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Announcement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
