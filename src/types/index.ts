/**
 * Shared type definitions for the Community Allotment application
 */

// Announcement Types
export type AnnouncementType = 'delivery' | 'order' | 'tip' | 'event'
export type AnnouncementPriority = 'high' | 'medium' | 'low'

export interface Announcement {
  id: string
  type: AnnouncementType
  title: string
  content: string
  author: string
  date: string
  priority: AnnouncementPriority
  isActive: boolean
  createdAt: string
  updatedAt: string
  views?: number
  reactions?: number
}

// Form data for creating/editing announcements
export interface AnnouncementFormData {
  title: string
  content: string
  type: string
  priority: string
  date: string
}

// API Response Types
export interface ApiErrorResponse {
  error: string
}

export interface ApiSuccessResponse<T> {
  data: T
}

// Chat/AI Advisor Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  image?: string | null
}

export interface AIAdvisorRequest {
  message: string
  messages?: ChatMessage[]
  image?: {
    data: string
    type: string
  }
}

export interface AIAdvisorResponse {
  response: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// User Location Types
export interface UserLocation {
  latitude: number
  longitude: number
  city?: string
  country?: string
  timezone?: string
}

// Calendar Event Types
export type EventType = 'delivery' | 'order' | 'community' | 'seasonal'

export interface CalendarEvent {
  id: number
  title: string
  time: string
  type: EventType
  description: string
  date?: string
}

// Markdown Component Props
export interface MarkdownComponentProps {
  children?: React.ReactNode
  className?: string
  href?: string
}

