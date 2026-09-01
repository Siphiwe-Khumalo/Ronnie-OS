import { useCallback, useMemo, useState } from 'react'
import ActivityCard from '../components/ActivityCard'
import ActivityForm from '../components/ActivityForm'
import { deleteActivity, getActivities, updateActivity } from '../db/activityRepository'
import { useActivities } from '../hooks/useActivities'
import { activityCategories, type Activity, type ActivityCategory, type CreateActivityInput } from '../types/activity'
import { activityCategoryLabels } from '../utils/activity'
import { getLocalDateKey } from '../utils/dates'

type CategoryFilter = 'all' | ActivityCategory

function getMutationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to save that activity. Please try again.'
}

function LogPage() {
  const loadActivities = useCallback(() => getActivities(), [])
  const { activities, error: loadError, isLoading, refresh } = useActivities(
    loadActivities,
    'Unable to load your activity history.',
  )
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const filteredActivities = useMemo(
    () => activities.filter((activity) => {
      const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter
      const matchesDate = !dateFilter || getLocalDateKey(new Date(activity.timestamp)) === dateFilter
      return matchesCategory && matchesDate
    }),
    [activities, categoryFilter, dateFilter],
  )

  const hasActiveFilters = categoryFilter !== 'all' || dateFilter !== ''

  async function handleSave(input: CreateActivityInput): Promise<void> {
    if (!editingActivity) return

    setIsSaving(true)
    setMutationError(null)

    try {
      await updateActivity(editingActivity.id, input)
      setEditingActivity(undefined)
      await refresh()
    } catch (saveError) {
      setMutationError(getMutationErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(activity: Activity): Promise<void> {
    const confirmed = window.confirm(`Delete “${activity.note}”?`)
    if (!confirmed) return

    setDeletingId(activity.id)
    setMutationError(null)

    try {
      await deleteActivity(activity.id)
      if (editingActivity?.id === activity.id) {
        setEditingActivity(undefined)
      }
      await refresh()
    } catch (deleteError) {
      setMutationError(getMutationErrorMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(activity: Activity): void {
    setMutationError(null)
    setEditingActivity(activity)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearFilters(): void {
    setCategoryFilter('all')
    setDateFilter('')
  }

  return (
    <section aria-labelledby="log-heading" className="mx-auto max-w-3xl">
      <div className="mb-10">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#899188]">History</p>
        <h1 id="log-heading" className="text-3xl font-semibold tracking-tight text-[#f3f5ef] sm:text-4xl">Activity log</h1>
        <p className="mt-3 max-w-md text-base leading-7 text-[#899188]">
          Everything you record, in one quiet place.
        </p>
      </div>

      {editingActivity ? (
        <ActivityForm
          activity={editingActivity}
          isSaving={isSaving}
          onCancel={() => setEditingActivity(undefined)}
          onSubmit={handleSave}
          resetKey={0}
        />
      ) : null}

      {mutationError ? <div className="mt-4 rounded-xl border border-[#f28f8f]/20 bg-[#f28f8f]/10 px-4 py-3 text-sm text-[#ffb0b0]" role="alert">{mutationError}</div> : null}

      <div className={`${editingActivity ? 'mt-6' : ''} rounded-2xl border border-white/10 bg-[#181d19] p-3 sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-1.5 block px-1 text-xs font-medium text-[#899188]">Category</span>
            <select
              aria-label="Filter by category"
              className="w-full rounded-xl border border-white/10 bg-[#101311] px-3.5 py-3 text-sm text-[#f3f5ef] outline-none transition-colors focus:border-[#c9f27b]/70 focus:ring-2 focus:ring-[#c9f27b]/10"
              onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
              value={categoryFilter}
            >
              <option value="all">All categories</option>
              {activityCategories.map((category) => (
                <option key={category} value={category}>{activityCategoryLabels[category]}</option>
              ))}
            </select>
          </label>
          <label className="block flex-1">
            <span className="mb-1.5 block px-1 text-xs font-medium text-[#899188]">Date</span>
            <input
              aria-label="Filter by date"
              className="w-full rounded-xl border border-white/10 bg-[#101311] px-3.5 py-3 text-sm text-[#f3f5ef] outline-none transition-colors focus:border-[#c9f27b]/70 focus:ring-2 focus:ring-[#c9f27b]/10"
              onChange={(event) => setDateFilter(event.target.value)}
              type="date"
              value={dateFilter}
            />
          </label>
          {hasActiveFilters ? (
            <button className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#899188] transition-colors hover:border-white/20 hover:bg-white/5 hover:text-[#f3f5ef]" onClick={clearFilters} type="button">
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#899188]">Activities</h2>
          {!isLoading && !loadError ? <span className="text-xs text-[#687168]">{filteredActivities.length} of {activities.length}</span> : null}
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-[#f28f8f]/20 bg-[#f28f8f]/10 px-6 py-8 text-center" role="alert">
            <p className="font-medium text-[#ffb0b0]">Couldn’t load your activity history.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#d99b9b]">{loadError}</p>
            <button className="mt-5 rounded-xl border border-[#ffb0b0]/30 px-4 py-2.5 text-sm font-semibold text-[#ffb0b0] transition-colors hover:bg-[#f28f8f]/10" onClick={() => void refresh()} type="button">Try again</button>
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#181d19] px-6 py-12 text-center" aria-live="polite">
            <div className="mx-auto mb-4 size-6 animate-pulse rounded-full bg-[#c9f27b]" />
            <p className="text-sm text-[#899188]">Loading your activity history…</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#252d26] text-xl text-[#c9f27b]">≡</div>
            <p className="font-medium text-[#dce2d8]">Your activity history is empty.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#899188]">
              Activities you record on Today will be collected here.
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#252d26] text-xl text-[#c9f27b]">⌕</div>
            <p className="font-medium text-[#dce2d8]">No activities match these filters.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#899188]">
              Try a different category or date, or clear the filters to see everything.
            </p>
            <button className="mt-5 rounded-xl bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#1a2415] transition-colors hover:bg-[#d5f896]" onClick={clearFilters} type="button">Clear filters</button>
          </div>
        ) : (
          <div className="relative space-y-3 before:absolute before:bottom-5 before:left-0 before:top-5 before:w-px before:bg-white/10">
            {filteredActivities.map((activity) => (
              <ActivityCard
                activity={activity}
                isDeleting={deletingId === activity.id}
                key={activity.id}
                onDelete={handleDelete}
                onEdit={handleEdit}
                showDate
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default LogPage
