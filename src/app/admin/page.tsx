'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Users, Bell, BarChart3, Settings, Loader2 } from 'lucide-react'

// Static announcements data - will be replaced with API data
const staticAnnouncements = [
  {
    id: 1,
    title: 'Bark Mulch Delivery - This Saturday',
    type: 'delivery',
    status: 'published',
    author: 'Admin',
    date: '2025-06-16',
    views: 45,
    reactions: 12
  },
  {
    id: 2,
    title: 'Summer Seed Order Deadline',
    type: 'order',
    status: 'published',
    author: 'Plot Manager',
    date: '2025-06-15',
    views: 32,
    reactions: 8
  },
  {
    id: 3,
    title: 'Water Conservation Workshop',
    type: 'event',
    status: 'draft',
    author: 'Admin',
    date: '2025-06-18',
    views: 0,
    reactions: 0
  }
]

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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('announcements')
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      // Fallback to static data if API fails
      setAnnouncements(staticAnnouncements)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const renderAnnouncementsTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Announcements</h2>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin mr-2" />
                      <span className="text-gray-500">Loading announcements...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
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
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No announcements found
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span data-testid={`type-badge-${announcement.type}`} className={`px-2 py-1 text-xs font-medium rounded-full border ${typeColors[announcement.type as keyof typeof typeColors]}`}>
                      {announcement.type}
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
                        {announcement.views || 0}
                      </span>
                      <span className="flex items-center">
                        👍 {announcement.reactions || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button data-testid="edit-button" className="text-primary-600 hover:text-primary-700">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button data-testid="delete-button" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
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
        {stats.map((stat, index) => {
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
    </div>
  )
}
