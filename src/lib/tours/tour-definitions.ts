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
          title: 'Welcome to Your Garden',
          description: 'This card shows where you are in the growing season. The advice updates as the year progresses, helping you stay on track.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="quick-actions"]',
        popover: {
          title: 'Navigate Quickly',
          description: 'These shortcuts take you to the main sections: plan your beds, check the calendar, manage seeds, or chat with Aitor.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="task-list"]',
        popover: {
          title: 'Your Personal To-Do List',
          description: 'Tasks are generated based on what you\'ve planted and the current season. Check them off as you go!',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="ai-insight"]',
        popover: {
          title: 'Meet Aitor',
          description: 'Aitor is your AI gardening companion. He looks at your garden and suggests what needs attention. Tap to ask him anything!',
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
          title: 'Explore the Year',
          description: 'Tap any month to see what to sow, plant, and harvest. Great for planning ahead or checking what you should be doing now.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="month-overview"]',
        popover: {
          title: 'Monthly Focus',
          description: 'Each month has its own rhythm. This overview tells you what to expect and where to focus your energy.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="your-garden"]',
        popover: {
          title: 'Your Plantings',
          description: 'Once you add plants in the Allotment section, you\'ll see personalised info here about what might be ready.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="sowing-section"]',
        popover: {
          title: 'Time to Sow',
          description: 'These lists are tailored for Scottish conditions - shorter summers, later last frosts. Indoor sowing gives you a head start!',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="harvest-section"]',
        popover: {
          title: 'Harvest Time',
          description: 'The best bit! These crops are typically ready to pick this month. Nothing beats fresh veg straight from your plot.',
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
          title: 'Plan Across Years',
          description: 'Switch between seasons to plan next year or review what you grew before. The + button adds new years for planning ahead.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="season-status"]',
        popover: {
          title: 'Quick Planning Status',
          description: 'At a glance: how many beds still need plants, and varieties you might want to consider from last year.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="plot-overview"]',
        popover: {
          title: 'Your Plot Map',
          description: 'Drag beds to rearrange them. Tap any area to see its details. The layout saves automatically and can be different each year.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="add-area-btn"]',
        popover: {
          title: 'Expand Your Plot',
          description: 'Add rotation beds for annual veg, permanent spots for fruit trees, berry bushes, or even a compost bin!',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '[data-tour="item-detail"]',
        popover: {
          title: 'Bed Details',
          description: 'When you select a bed, manage its plantings here. Add crops, track rotation groups, and make notes about what worked.',
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
          title: 'Seeds by Season',
          description: 'View all your varieties, or filter to a specific year. This helps you see what seeds you need for next season\'s plan.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="seed-stats"]',
        popover: {
          title: 'Seed Inventory',
          description: 'Track what you have vs what you need to order. Tap these cards to filter the list below. Spend tracking is there too!',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="add-variety-btn"]',
        popover: {
          title: 'Add Your Seeds',
          description: 'Record variety names, suppliers, prices, and notes. Link them to specific vegetables to see them when planning beds.',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '[data-tour="variety-list"]',
        popover: {
          title: 'Your Seed Collection',
          description: 'Grouped by vegetable for easy browsing. Tap the status badge (Need/Ordered/Have/Had) to update as your seeds arrive!',
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
          title: 'Unlock Aitor',
          description: 'Add your OpenAI API key to chat with Aitor. He can identify plants from photos, suggest what to grow, and even add plants for you!',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="location-settings"]',
        popover: {
          title: 'Set Your Location',
          description: 'Your location helps with personalised growing advice. Scotland\'s microclimates vary a lot - coastal vs inland makes a difference!',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="data-management"]',
        popover: {
          title: 'Backup Your Data',
          description: 'Export your garden data to a file for safekeeping. You can import it back later or on a new device.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="share-settings"]',
        popover: {
          title: 'Share Between Devices',
          description: 'Want your garden on your phone and tablet? Generate a QR code to quickly transfer your data. Links expire after 5 minutes.',
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

/**
 * Map paths to tour IDs for keyboard shortcut handling
 */
export function getTourIdForPath(pathname: string): TourId | null {
  const pathToTour: Record<string, TourId> = {
    '/': 'today',
    '/this-month': 'this-month',
    '/allotment': 'allotment',
    '/seeds': 'seeds',
    '/settings': 'settings',
  }
  return pathToTour[pathname] || null
}
