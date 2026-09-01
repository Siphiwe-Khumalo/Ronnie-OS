import { useCallback } from 'react'
import { getTodayActivities } from '../db/activityRepository'
import { useActivities } from './useActivities'

export function useTodayActivities() {
  const loadActivities = useCallback(() => getTodayActivities(), [])
  return useActivities(loadActivities, 'Unable to load today’s activities.')
}
