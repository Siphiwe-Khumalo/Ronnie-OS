export interface LocalDayBounds {
  start: Date
  end: Date
}

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid date')
  }
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

export function toIsoTimestamp(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  assertValidDate(date)
  return date.toISOString()
}

export function getLocalDateKey(date: Date = new Date()): string {
  assertValidDate(date)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getLocalDayBounds(date: Date = new Date()): LocalDayBounds {
  assertValidDate(date)

  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { start, end }
}
