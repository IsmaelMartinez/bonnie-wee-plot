import type { DriveStep } from 'driver.js'

/**
 * Tour definitions for each page in the app.
 * Each tour is an array of driver.js steps targeting specific elements.
 */

export type TourId = 'today' | 'this-month' | 'allotment' | 'seeds' | 'settings'

export interface TourDefinition {
  id: TourId
  name: string
  description: string
  steps: DriveStep[]
}

export const tourDefinitions: Record<TourId, TourDefinition> = {
  today: {
    id: 'today',
    name: 'Today Dashboard',
    description: 'Your daily garden overview',
    steps: [
      {
        element: '[data-tour="season-card"]',
        popover: {
          title: 'Seasonal Overview',
          description: 'See what phase of the growing season you\'re in and what to focus on right now.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="quick-actions"]',
        popover: {
          title: 'Quick Actions',
          description: 'Jump to key areas of the app: your allotment, calendar, seeds, and AI advisor.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="task-list"]',
        popover: {
          title: 'Your Tasks',
          description: 'Personalised tasks based on your plantings and the current season. Complete them to keep your garden thriving!',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="ai-insight"]',
        popover: {
          title: 'AI Insights',
          description: 'Aitor analyses your garden and provides timely advice. Click to chat for more help.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  'this-month': {
    id: 'this-month',
    name: 'Monthly Calendar',
    description: 'Seasonal planting guidance',
    steps: [
      {
        element: '[data-tour="month-selector"]',
        popover: {
          title: 'Month Selector',
          description: 'Browse through the year to see what to sow, plant, and harvest each month.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="month-overview"]',
        popover: {
          title: 'Monthly Overview',
          description: 'A summary of the growing conditions and key focus areas for the selected month.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="your-garden"]',
        popover: {
          title: 'Your Garden This Month',
          description: 'Once you add plantings, you\'ll see personalised information about your crops here.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="sowing-section"]',
        popover: {
          title: 'What to Sow',
          description: 'Lists of vegetables to sow indoors and outdoors this month, tailored for Scottish conditions.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="harvest-section"]',
        popover: {
          title: 'Ready to Harvest',
          description: 'Crops that are typically ready to harvest this month.',
          side: 'left',
          align: 'start',
        },
      },
    ],
  },

  allotment: {
    id: 'allotment',
    name: 'Plot Layout',
    description: 'Plan and track your garden beds',
    steps: [
      {
        element: '[data-tour="year-selector"]',
        popover: {
          title: 'Year Navigation',
          description: 'Switch between seasons to plan ahead or review past years. Click + to add new years.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="season-status"]',
        popover: {
          title: 'Season Status',
          description: 'Quick overview of your planning progress - beds needing rotation and varieties to consider.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="plot-overview"]',
        popover: {
          title: 'Plot Overview',
          description: 'Your allotment layout. Drag areas to rearrange, click to select and view details.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="add-area-btn"]',
        popover: {
          title: 'Add Areas',
          description: 'Add beds, trees, berry bushes, or infrastructure to your plot.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '[data-tour="item-detail"]',
        popover: {
          title: 'Area Details',
          description: 'When you select an area, its details appear here. Add plantings, notes, and manage crop rotation.',
          side: 'left',
          align: 'start',
        },
      },
    ],
  },

  seeds: {
    id: 'seeds',
    name: 'Seeds & Varieties',
    description: 'Track your seed collection',
    steps: [
      {
        element: '[data-tour="year-tabs"]',
        popover: {
          title: 'Filter by Year',
          description: 'View all varieties or filter to a specific year. Track which seeds you have for each season.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="seed-stats"]',
        popover: {
          title: 'Seed Status',
          description: 'Quick count of seeds you have vs need to order. Click to filter the list.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="add-variety-btn"]',
        popover: {
          title: 'Add Varieties',
          description: 'Track a new seed variety with supplier, price, and notes.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '[data-tour="variety-list"]',
        popover: {
          title: 'Your Varieties',
          description: 'Varieties grouped by vegetable. Click the status badge to cycle through: Need → Ordered → Have → Had.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  settings: {
    id: 'settings',
    name: 'Settings',
    description: 'Configure your preferences',
    steps: [
      {
        element: '[data-tour="ai-settings"]',
        popover: {
          title: 'AI Assistant',
          description: 'Configure your OpenAI API key to unlock Aitor, your AI gardening companion.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="location-settings"]',
        popover: {
          title: 'Location',
          description: 'Set your location for personalised growing advice based on your local climate.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="data-management"]',
        popover: {
          title: 'Data Management',
          description: 'Export your data for backup or import from a previous backup.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="share-settings"]',
        popover: {
          title: 'Share & Sync',
          description: 'Share your allotment data with another device using a QR code or short code.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },
}

/**
 * Get a tour definition by ID
 */
export function getTourDefinition(id: TourId): TourDefinition | undefined {
  return tourDefinitions[id]
}

/**
 * Get all available tours
 */
export function getAllTours(): TourDefinition[] {
  return Object.values(tourDefinitions)
}
