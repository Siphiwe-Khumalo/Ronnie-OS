import {
  activitySchema,
  createActivityInputSchema,
  updateActivityInputSchema,
  type Activity,
  type CreateActivityInput,
  type UpdateActivityInput,
} from '../types/activity'
import { getCurrentTimestamp, getLocalDayBounds, toIsoTimestamp } from '../utils/dates'
import { database } from './database'

function generateActivityId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).reduce(
      (uuid, byte, index) => `${uuid}${index === 4 || index === 6 || index === 8 || index === 10 ? '-' : ''}${byte}`,
      '',
    )
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

function validateStoredActivity(value: Activity): Activity {
  return activitySchema.parse(value)
}

function sortNewestFirst(activities: Activity[]): Activity[] {
  return activities.sort((left, right) => right.timestamp.localeCompare(left.timestamp))
}

export async function createActivity(input: CreateActivityInput): Promise<Activity> {
  const validatedInput = createActivityInputSchema.parse(input)
  const now = getCurrentTimestamp()

  const activity = activitySchema.parse({
    ...validatedInput,
    id: generateActivityId(),
    timestamp: validatedInput.timestamp === undefined ? now : toIsoTimestamp(validatedInput.timestamp),
    source: 'manual',
    createdAt: now,
    updatedAt: now,
  })

  await database.activities.add(activity)
  return activity
}

export async function getActivities(): Promise<Activity[]> {
  const activities = await database.activities.orderBy('timestamp').reverse().toArray()
  return sortNewestFirst(activities.map(validateStoredActivity))
}

export async function getTodayActivities(date: Date = new Date()): Promise<Activity[]> {
  const { start, end } = getLocalDayBounds(date)
  const activities = await database.activities
    .where('timestamp')
    .between(start.toISOString(), end.toISOString(), true, false)
    .toArray()

  return sortNewestFirst(activities.map(validateStoredActivity))
}

export async function updateActivity(id: string, changes: UpdateActivityInput): Promise<Activity> {
  const validatedId = activitySchema.shape.id.parse(id)
  const validatedChanges = updateActivityInputSchema.parse(changes)
  const existingRecord = await database.activities.get(validatedId)

  if (!existingRecord) {
    throw new Error(`Activity not found: ${validatedId}`)
  }

  const existingActivity = validateStoredActivity(existingRecord)
  const updatedActivity = activitySchema.parse({
    ...existingActivity,
    ...validatedChanges,
    id: existingActivity.id,
    timestamp: validatedChanges.timestamp === undefined
      ? existingActivity.timestamp
      : toIsoTimestamp(validatedChanges.timestamp),
    source: 'manual',
    createdAt: existingActivity.createdAt,
    updatedAt: getCurrentTimestamp(),
  })

  await database.activities.put(updatedActivity)
  return updatedActivity
}

export async function deleteActivity(id: string): Promise<void> {
  const validatedId = activitySchema.shape.id.parse(id)
  await database.activities.delete(validatedId)
}
