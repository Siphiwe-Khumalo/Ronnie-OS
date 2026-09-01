import Dexie, { type Table } from 'dexie'
import type { Activity } from '../types/activity'

class RonnieDatabase extends Dexie {
  activities!: Table<Activity, string>

  constructor() {
    super('ronnie-os')

    this.version(1).stores({
      activities: 'id, timestamp, category',
    })
  }
}

export const database = new RonnieDatabase()
