import { test, expect, Page } from '@playwright/test';

// ============ HELPERS ============

/**
 * Create minimal allotment data WITHOUT setup completed (triggers onboarding)
 */
function createNewUserData() {
  return {
    version: 16,
    meta: {
      name: 'My Allotment',
      setupCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    layout: { areas: [] },
    seasons: [],
    currentYear: new Date().getFullYear(),
    varieties: []
  }
}

/**
 * Complete the onboarding wizard step by step
 */
async function completeOnboardingWizard(page: Page) {
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByText('Show me what to grow').click()
  await expect(page.getByText("Got it, let's go")).toBeVisible()
  await page.getByText("Got it, let's go").click()
  await expect(page.getByText('Start Exploring')).toBeVisible()

  // Wait for dialog to close when clicking "Start Exploring"
  await Promise.all([
    page.getByRole('dialog').waitFor({ state: 'hidden' }),
    page.getByText('Start Exploring').click()
  ])
}

/**
 * Create allotment data WITH setup completed (skips onboarding)
 */
function createExistingUserData() {
  return {
    version: 16,
    meta: {
      name: 'My Allotment',
      setupCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    layout: { areas: [] },
    seasons: [],
    currentYear: new Date().getFullYear(),
    varieties: []
  }
}

/**
 * Skip onboarding by setting setupCompleted flag
 */
async function skipOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('allotment-unified-data', JSON.stringify({
      meta: { setupCompleted: true },
      layout: { areas: [] },
      seasons: [],
      currentYear: new Date().getFullYear(),
      varieties: []
    }))
    localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
  })
}

// ============ TESTS ============

test.describe('Onboarding Wizard - Display', () => {
  test('onboarding wizard appears for new users (setupCompleted: false)', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for the dialog to appear
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should show welcome title
    await expect(page.getByText('Welcome to Bonnie Wee Plot')).toBeVisible()
  })

  test('onboarding wizard shows all three path options', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Check for all three path options
    await expect(page.getByText('Show me what to grow')).toBeVisible()
    await expect(page.getByText('I have a plot to plan')).toBeVisible()
    await expect(page.getByText('I just want to ask')).toBeVisible()
  })

  test('onboarding wizard does NOT appear when setupCompleted is true', async ({ page }) => {
    await skipOnboarding(page)
    await page.goto('/')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // Dialog should NOT be visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).not.toBeVisible()
  })

  test('onboarding wizard does NOT appear for returning users', async ({ page }) => {
    const existingUserData = createExistingUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
    }, existingUserData)
    await page.goto('/')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // Dialog should NOT be visible
    const dialog = page.getByRole('dialog')
    await expect(dialog).not.toBeVisible()
  })
})

test.describe('Onboarding Wizard - Explore Path', () => {
  test('selecting "Show me what to grow" navigates through explore path', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click "Show me what to grow" path
    await page.getByText('Show me what to grow').click()

    // Should show Screen 2 - Action guidance
    await expect(page.getByText('Getting Started')).toBeVisible()
    await expect(page.getByText('Seasonal Calendar')).toBeVisible()
    await expect(page.getByText('What you\'ll find:')).toBeVisible()

    // Click "Got it, let's go"
    await page.getByText("Got it, let's go").click()

    // Should show Screen 3 - Success
    await expect(page.getByText('All set!')).toBeVisible()
    await expect(page.getByText('Next steps:')).toBeVisible()

    // Click "Start Exploring"
    await page.getByText('Start Exploring').click()

    // Should navigate to /this-month
    await expect(page).toHaveURL(/this-month/)
  })

  test('explore path shows correct guidance content', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByText('Show me what to grow').click()

    // Check explore-specific content
    await expect(page.getByText('Plants suited to our climate and day length')).toBeVisible()
    await expect(page.getByText(/Scotland's growing season/)).toBeVisible()
  })
})

test.describe('Onboarding Wizard - Plan Path', () => {
  test('selecting "I have a plot to plan" navigates through plan path', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click "I have a plot to plan" path
    await page.getByText('I have a plot to plan').click()

    // Should show Screen 2
    await expect(page.getByText('Getting Started')).toBeVisible()
    await expect(page.getByText('Your Allotment')).toBeVisible()

    // Click "Got it, let's go"
    await page.getByText("Got it, let's go").click()

    // Should show Screen 3
    await expect(page.getByText('All set!')).toBeVisible()

    // Click "Start Exploring"
    await page.getByText('Start Exploring').click()

    // Should navigate to /allotment
    await expect(page).toHaveURL(/allotment/)
  })

  test('plan path shows correct guidance content', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByText('I have a plot to plan').click()

    // Check plan-specific content
    await expect(page.getByText('Visual bed layout for your plot')).toBeVisible()
    await expect(page.getByText('Start with one bed')).toBeVisible()
  })
})

test.describe('Onboarding Wizard - Ask Path', () => {
  test('selecting "I just want to ask" navigates through ask path', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click "I just want to ask" path
    await page.getByText('I just want to ask').click()

    // Should show Screen 2 (within the dialog)
    await expect(page.getByText('Getting Started')).toBeVisible()
    await expect(page.getByLabel('Getting Started').getByRole('heading', { name: 'Ask Aitor' })).toBeVisible()

    // Click "Got it, let's go"
    await page.getByText("Got it, let's go").click()

    // Should show Screen 3
    await expect(page.getByText('All set!')).toBeVisible()

    // Click "Start Exploring"
    await expect(page.getByText('Start Exploring')).toBeVisible()

    // Wait for dialog to close (which means onboarding completed)
    await Promise.all([
      page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 30000 }),
      page.getByText('Start Exploring').click()
    ])

    // Verify we're back on homepage after /ai-advisor redirects to /
    await expect(page).toHaveURL('/')
  })

  test('ask path shows correct guidance content', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByText('I just want to ask').click()

    // Check ask-specific content
    await expect(page.getByText('Personalised advice for your specific plot')).toBeVisible()
    await expect(page.getByText(/Aitor knows about your allotment data/)).toBeVisible()
  })
})

test.describe('Onboarding Wizard - Skip', () => {
  test('clicking "Skip for now" closes wizard without navigation', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Click "Skip for now"
    await page.getByText('Skip for now').click()

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Should stay on homepage
    await expect(page).toHaveURL('/')
  })

  test('wizard does NOT appear again after skip', async ({ page }) => {
    const newUserData = createNewUserData()

    // Only set initial data if not already present (to avoid resetting on reload)
    await page.addInitScript((data) => {
      if (!localStorage.getItem('allotment-unified-data')) {
        localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      }
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog and skip
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByText('Skip for now').click()
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // Wait for debounced save to complete (500ms debounce + buffer)
    await page.waitForTimeout(700)

    // Reload the page
    await page.reload()

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // Dialog should NOT appear again
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Onboarding Wizard - Back Navigation', () => {
  test('clicking "Back" on Screen 2 returns to Screen 1', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Go to Screen 2
    await page.getByText('Show me what to grow').click()
    await expect(page.getByText('Getting Started')).toBeVisible()

    // Click Back
    await page.getByText('Back').click()

    // Should be back on Screen 1
    await expect(page.getByText('Welcome to Bonnie Wee Plot')).toBeVisible()
    await expect(page.getByText('Show me what to grow')).toBeVisible()
  })

  test('can select a different path after going back', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible()

    // Go to Screen 2 via explore
    await page.getByText('Show me what to grow').click()
    await expect(page.getByText('Seasonal Calendar')).toBeVisible()

    // Go back
    await page.getByText('Back').click()

    // Select a different path
    await page.getByText('I just want to ask').click()

    // Should see ask path content (within the dialog)
    await expect(page.getByLabel('Getting Started').getByRole('heading', { name: 'Ask Aitor' })).toBeVisible()
  })
})

test.describe('Onboarding Wizard - Completion State', () => {
  test('completing wizard sets setupCompleted to true', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Complete the wizard step by step, waiting for each screen
    await completeOnboardingWizard(page)

    // Wait for navigation
    await expect(page).toHaveURL(/this-month/)

    // Check localStorage for setupCompleted
    const setupCompleted = await page.evaluate(() => {
      const data = localStorage.getItem('allotment-unified-data')
      if (data) {
        const parsed = JSON.parse(data)
        return parsed.meta.setupCompleted
      }
      return false
    })

    expect(setupCompleted).toBe(true)
  })

  test('wizard does NOT appear after completing the flow', async ({ page }) => {
    const newUserData = createNewUserData()

    // Only set initial data if not already present (to avoid resetting on navigation)
    await page.addInitScript((data) => {
      if (!localStorage.getItem('allotment-unified-data')) {
        localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      }
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Complete the wizard step by step, waiting for each screen
    await completeOnboardingWizard(page)
    await expect(page).toHaveURL(/this-month/)

    // Navigate back to homepage
    await page.goto('/')

    // Wait for page to load
    await expect(page.getByRole('heading', { name: /Today/i })).toBeVisible()

    // Wizard should NOT appear
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })
})

test.describe('Onboarding Wizard - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('onboarding wizard displays correctly on mobile', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // All three paths should be visible
    await expect(page.getByText('Show me what to grow')).toBeVisible()
    await expect(page.getByText('I have a plot to plan')).toBeVisible()
    await expect(page.getByText('I just want to ask')).toBeVisible()
  })

  test('onboarding flow works correctly on mobile', async ({ page }) => {
    const newUserData = createNewUserData()

    await page.addInitScript((data) => {
      localStorage.setItem('allotment-unified-data', JSON.stringify(data))
      localStorage.setItem('bonnie-wee-plot-tours', JSON.stringify({ disabled: true, completed: [], dismissed: [], pageVisits: {} }))
    }, newUserData)
    await page.goto('/')

    // Complete the flow on mobile
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByText('Show me what to grow').click()
    await expect(page.getByText('Seasonal Calendar')).toBeVisible()
    await page.getByText("Got it, let's go").click()
    await expect(page.getByText('All set!')).toBeVisible()
    await page.getByText('Start Exploring').click()
    await expect(page).toHaveURL(/this-month/)
  })
})
