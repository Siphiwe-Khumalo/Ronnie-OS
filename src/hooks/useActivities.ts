import { useCallback, useEffect, useState } from 'react'
import type { Activity } from '../types/activity'

interface UseActivitiesResult {
  activities: Activity[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage
}

export function useActivities(
  loadActivities: () => Promise<Activity[]>,
  fallbackMessage: string,
): UseActivitiesResult {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setActivities(await loadActivities())
    } catch (loadError) {
      setError(getErrorMessage(loadError, fallbackMessage))
    } finally {
      setIsLoading(false)
    }
  }, [fallbackMessage, loadActivities])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { activities, error, isLoading, refresh }
}
