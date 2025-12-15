/**
 * Shared utilities for announcement data operations
 */

import { promises as fs } from 'fs'
import path from 'path'
import { NextRequest } from 'next/server'
import type { Announcement } from '@/types'

/**
 * Get the data file path based on environment and test mode
 */
export function getDataFile(request?: NextRequest): string {
  // Check if we're in test mode and have a worker ID header
  if (process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE === 'true' && request) {
    const workerHeader = request.headers.get('x-playwright-worker-id')
    if (workerHeader) {
      return path.join(process.cwd(), 'data', `announcements-test-${workerHeader}.json`)
    }
  }
  return path.join(process.cwd(), 'data', 'announcements.json')
}

/**
 * Ensure the data directory exists
 */
export async function ensureDataDir(dataFile: string): Promise<void> {
  const dataDir = path.dirname(dataFile)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

/**
 * Read announcements from the data file
 */
export async function readAnnouncements(dataFile: string): Promise<Announcement[]> {
  try {
    await ensureDataDir(dataFile)
    const data = await fs.readFile(dataFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

/**
 * Write announcements to the data file
 */
export async function writeAnnouncements(dataFile: string, announcements: Announcement[]): Promise<void> {
  await ensureDataDir(dataFile)
  await fs.writeFile(dataFile, JSON.stringify(announcements, null, 2))
}

/**
 * Valid announcement types
 */
export const VALID_ANNOUNCEMENT_TYPES = ['delivery', 'order', 'tip', 'event'] as const

/**
 * Valid priority levels
 */
export const VALID_PRIORITIES = ['high', 'medium', 'low'] as const

/**
 * Validate announcement type
 */
export function isValidAnnouncementType(type: string): type is typeof VALID_ANNOUNCEMENT_TYPES[number] {
  return VALID_ANNOUNCEMENT_TYPES.includes(type as typeof VALID_ANNOUNCEMENT_TYPES[number])
}

/**
 * Validate priority level
 */
export function isValidPriority(priority: string): priority is typeof VALID_PRIORITIES[number] {
  return VALID_PRIORITIES.includes(priority as typeof VALID_PRIORITIES[number])
}

