import { useState } from 'react'
import ActivityCard from '../components/ActivityCard'
import ActivityForm from '../components/ActivityForm'
import { createActivity, deleteActivity, updateActivity } from '../db/activityRepository'
import { useTodayActivities } from '../hooks/useTodayActivities'
import type { Activity, CreateActivityInput } from '../types/activity'
import { activityCategoryLabels } from '../utils/activity'

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getMutationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to save that activity. Please try again.'
}

function TodayPage() {
  const [now] = useState(() => new Date())
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [formResetKey, setFormResetKey] = useState(0)
  const { activities, error: loadError, isLoading, refresh } = useTodayActivities()

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(now)

  async function handleSave(input: CreateActivityInput): Promise<void> {
    setIsSaving(true)
    setMutationError(null)

    try {
      if (editingActivity) {
        await updateActivity(editingActivity.id, input)
        setEditingActivity(undefined)
      } else {
        await createActivity(input)
        setFormResetKey((key) => key + 1)
      }
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

  return (
    <section aria-labelledby="today-heading" className="mx-auto max-w-2xl">
      <div className="mb-10">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#899188]">{dateLabel}</p>
        <h1 id="today-heading" className="text-3xl font-semibold tracking-tight text-[#f3f5ef] sm:text-4xl">
          {getGreeting(now.getHours())}, Ronnie <span aria-hidden="true">👋🏾</span>
        </h1>
        <p className="mt-3 max-w-md text-base leading-7 text-[#899188]">
          Capture what you do. The meaning can come later.
        </p>
      </div>

      <ActivityForm
        activity={editingActivity}
        isSaving={isSaving}
        onCancel={editingActivity ? () => setEditingActivity(undefined) : undefined}
        onSubmit={handleSave}
        resetKey={formResetKey}
      />

      {mutationError ? <div className="mt-4 rounded-xl border border-[#f28f8f]/20 bg-[#f28f8f]/10 px-4 py-3 text-sm text-[#ffb0b0]" role="alert">{mutationError}</div> : null}

      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#899188]">Today</h2>
          {!isLoading && !loadError ? <span className="text-xs text-[#687168]">{activities.length} {activities.length === 1 ? 'activity' : 'activities'}</span> : null}
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-[#f28f8f]/20 bg-[#f28f8f]/10 px-6 py-8 text-center" role="alert">
            <p className="font-medium text-[#ffb0b0]">Couldn’t load today’s activities.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#d99b9b]">{loadError}</p>
            <button className="mt-5 rounded-xl border border-[#ffb0b0]/30 px-4 py-2.5 text-sm font-semibold text-[#ffb0b0] transition-colors hover:bg-[#f28f8f]/10" onClick={() => void refresh()} type="button">Try again</button>
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-[#181d19] px-6 py-12 text-center" aria-live="polite">
            <div className="mx-auto mb-4 size-6 animate-pulse rounded-full bg-[#c9f27b]" />
            <p className="text-sm text-[#899188]">Loading today’s activities…</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-12 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#252d26] text-xl text-[#c9f27b]">+</div>
            <p className="font-medium text-[#dce2d8]">Your day starts here.</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#899188]">
              Add your first activity above and build a clear picture of your day.
            </p>
          </div>
        ) : (
          <div className="relative space-y-3 before:absolute before:bottom-5 before:left-0 before:top-5 before:w-px before:bg-white/10">
            {activities.map((activity) => (
              <ActivityCard
                activity={activity}
                isDeleting={deletingId === activity.id}
                key={activity.id}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {activities.length > 0 ? (
        <p className="mt-6 text-center text-xs text-[#687168]">
          Categories: {Object.values(activityCategoryLabels).join(' · ')}
        </p>
      ) : null}
    </section>
  )
}

export default TodayPage
