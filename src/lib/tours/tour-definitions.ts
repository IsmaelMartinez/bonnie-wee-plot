import type { DriveStep } from 'driver.js'

/**
 * Tour definitions for each page in the app.
 * Each tour is an array of driver.js steps targeting specific elements.
 */

/**
 * Extended step type that includes which settings tab a step needs.
 * Used by useTour to switch tabs before advancing to the step.
 */
export interface SettingsTabStep extends DriveStep {
  /** Which settings tab this step requires (switches before highlighting) */
  settingsTab?: string
}

export type TourId = 'today' | 'this-month' | 'allotment' | 'seeds' | 'settings' | 'compost' | 'plants'

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
          description: 'These shortcuts take you to the main sections: plan your beds, check the calendar, manage seeds, or browse the plant guide.',
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
        element: '[data-tour="compost-alerts"]',
        popover: {
          title: 'Compost Updates',
          description: 'If you have compost piles, alerts appear here when they need turning or are ready to use. Tap an alert to go to the Compost section.',
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
          description: 'Tap any month to see what to sow, plant, and harvest throughout the year.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="planting-calendar"]',
        popover: {
          title: 'Planting Calendar',
          description: 'A visual timeline of your plantings showing sow and harvest windows. Click month headers to jump to that month.',
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
          description: 'These lists are tailored for Scottish conditions — shorter summers, later last frosts. Indoor sowing gives you a head start!',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="plantout-section"]',
        popover: {
          title: 'Plant Out',
          description: 'Seedlings and transplants that are ready to go outside this month. Harden off gradually before planting.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '[data-tour="harvest-section"]',
        popover: {
          title: 'Harvest Time',
          description: 'The best bit! These crops are typically ready to pick this month. Nothing beats fresh veg straight from your plot.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="keytasks-section"]',
        popover: {
          title: 'Key Tasks',
          description: 'Essential jobs for the month — weeding, feeding, pest control, and general plot maintenance to keep things on track.',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '[data-tour="monthly-tips"]',
        popover: {
          title: 'Tips & Insights',
          description: 'Scroll horizontally for weather forecasts, gardening tips, and expert advice on composting, rotation, and more.',
          side: 'top',
          align: 'center',
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
          description: 'Track what you have vs what you need to order. When viewing a specific year, tap these cards to filter the list below.',
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
          description: 'Grouped by vegetable for easy browsing. When viewing a year, tap the status badge to cycle through Need/Ordered/Have/Had. In "All" view, use "Add to Year" to plan ahead.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="suppliers-section"]',
        popover: {
          title: 'Your Suppliers',
          description: 'Quick links to the seed suppliers you\'ve used. These are populated automatically from the varieties you add.',
          side: 'top',
          align: 'center',
        },
      },
    ],
  },

  compost: {
    id: 'compost',
    name: 'Compost',
    description: 'Track your compost piles',
    steps: [
      {
        element: '[data-tour="add-pile-btn"]',
        popover: {
          title: 'Start a New Pile',
          description: 'Create a compost pile and choose your system type — hot compost, tumbler, bokashi, worm bin, or others.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="compost-piles"]',
        popover: {
          title: 'Your Compost Piles',
          description: 'Your piles appear here. Track inputs, log events like turning and watering, and update the status as your compost matures.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="care-tips"]',
        popover: {
          title: 'Care Tips',
          description: 'Quick troubleshooting reminders for healthy compost — what to do when it is too wet, too dry, or not heating up.',
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
        element: '[data-tour="settings-tabs"]',
        settingsTab: 'data',
        popover: {
          title: 'Settings Tabs',
          description: 'Settings are organised into tabs. Data for backups and sharing, and Help for guided tours.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="data-management"]',
        settingsTab: 'data',
        popover: {
          title: 'Backup Your Data',
          description: 'Export your garden data to a file for safekeeping. You can import it back later or on a new device.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="tour-management"]',
        settingsTab: 'help',
        popover: {
          title: 'Manage Tours',
          description: 'Replay any guided tour or reset them all. Each page has its own tour you can trigger with the ? key.',
          side: 'top',
          align: 'center',
        },
      },
    ] as SettingsTabStep[],
  },

  plants: {
    id: 'plants',
    name: 'Plant Guide',
    description: 'Browse the plant database',
    steps: [
      {
        element: '[data-tour="plant-search"]',
        popover: {
          title: 'Search Plants',
          description: 'Type a name to quickly find any plant in the database. Works with common names and varieties.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="category-filter"]',
        popover: {
          title: 'Filter by Category',
          description: 'Narrow the list to a specific group - leafy greens, root vegetables, brassicas, herbs, and more.',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '[data-tour="plant-list"]',
        popover: {
          title: 'Plant Cards',
          description: 'Tap any plant to see detailed growing info - sowing times, spacing, harvest windows, all tailored for Scottish conditions.',
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
    '/compost': 'compost',
    '/plants': 'plants',
  }
  return pathToTour[pathname] || null
}
