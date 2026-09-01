import type { ActivityCategory } from '../types/activity'

export const activityCategoryLabels: Record<ActivityCategory, string> = {
  work: 'Work',
  lumen: 'Lumen Labs',
  learning: 'Learning',
  life: 'Life',
  uncategorized: 'Uncategorized',
}

export function formatActivityTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatActivityDate(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function formatDateTimeLocal(timestamp: string): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
