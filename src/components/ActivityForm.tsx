import { useEffect, useState, type FormEvent } from 'react'
import { activityCategories, type Activity, type ActivityCategory, type CreateActivityInput } from '../types/activity'
import { toIsoTimestamp } from '../utils/dates'
import { activityCategoryLabels, formatDateTimeLocal } from '../utils/activity'

interface ActivityFormProps {
  activity?: Activity
  isSaving: boolean
  resetKey: number
  onCancel?: () => void
  onSubmit: (input: CreateActivityInput) => Promise<void>
}

const inputClassName = 'w-full rounded-xl border border-white/10 bg-[#101311] px-3.5 py-3 text-sm text-[#f3f5ef] outline-none transition-colors placeholder:text-[#687168] focus:border-[#c9f27b]/70 focus:ring-2 focus:ring-[#c9f27b]/10'

function ActivityForm({ activity, isSaving, resetKey, onCancel, onSubmit }: ActivityFormProps) {
  const isEditing = activity !== undefined
  const [note, setNote] = useState(activity?.note ?? '')
  const [category, setCategory] = useState<ActivityCategory>(activity?.category ?? 'uncategorized')
  const [duration, setDuration] = useState(activity?.durationMinutes?.toString() ?? '')
  const [timestamp, setTimestamp] = useState(activity ? formatDateTimeLocal(activity.timestamp) : '')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setNote(activity?.note ?? '')
    setCategory(activity?.category ?? 'uncategorized')
    setDuration(activity?.durationMinutes?.toString() ?? '')
    setTimestamp(activity ? formatDateTimeLocal(activity.timestamp) : '')
    setFormError(null)
  }, [activity, resetKey])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedNote = note.trim()
    if (!trimmedNote) {
      setFormError('Add a short note before saving.')
      return
    }

    let durationMinutes: number | undefined
    if (duration.trim()) {
      durationMinutes = Number(duration)
      if (!Number.isInteger(durationMinutes) || durationMinutes < 0) {
        setFormError('Duration must be a non-negative whole number.')
        return
      }
    }

    let activityTimestamp: string | undefined
    if (isEditing) {
      if (!timestamp) {
        setFormError('Choose a time for this activity.')
        return
      }

      const parsedTimestamp = new Date(timestamp)
      if (Number.isNaN(parsedTimestamp.getTime())) {
        setFormError('Choose a valid time for this activity.')
        return
      }
      activityTimestamp = toIsoTimestamp(parsedTimestamp)
    }

    const input: CreateActivityInput = {
      note: trimmedNote,
      category,
      ...(durationMinutes === undefined ? {} : { durationMinutes }),
      ...(activityTimestamp === undefined ? {} : { timestamp: activityTimestamp }),
    }

    setFormError(null)
    await onSubmit(input)
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-[#181d19] p-3 shadow-xl shadow-black/10 sm:p-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-4 px-1 pb-3">
        <div>
          <p className="text-sm font-semibold text-[#f3f5ef]">{isEditing ? 'Edit activity' : 'Log an activity'}</p>
          <p className="mt-1 text-xs text-[#687168]">
            {isEditing ? 'Keep the details accurate.' : 'Capture it now. Make sense of it later.'}
          </p>
        </div>
        {isEditing && onCancel ? (
          <button className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#899188] transition-colors hover:bg-white/5 hover:text-[#f3f5ef]" onClick={onCancel} type="button">
            Cancel
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="sr-only" htmlFor="activity-note">What did you do?</label>
        <textarea
          autoFocus={!isEditing}
          className={`${inputClassName} min-h-24 resize-y`}
          id="activity-note"
          onChange={(event) => setNote(event.target.value)}
          placeholder="What did you do?"
          rows={2}
          value={note}
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
          <label className="block">
            <span className="mb-1.5 block px-1 text-xs font-medium text-[#899188]">Category</span>
            <select className={inputClassName} onChange={(event) => setCategory(event.target.value as ActivityCategory)} value={category}>
              {activityCategories.map((option) => (
                <option key={option} value={option}>{activityCategoryLabels[option]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block px-1 text-xs font-medium text-[#899188]">Duration <span className="text-[#687168]">(optional)</span></span>
            <input
              className={inputClassName}
              inputMode="numeric"
              min="0"
              onChange={(event) => setDuration(event.target.value)}
              placeholder="Minutes"
              step="1"
              type="number"
              value={duration}
            />
          </label>
        </div>

        {isEditing ? (
          <label className="block">
            <span className="mb-1.5 block px-1 text-xs font-medium text-[#899188]">Time</span>
            <input className={inputClassName} onChange={(event) => setTimestamp(event.target.value)} type="datetime-local" value={timestamp} />
          </label>
        ) : null}
      </div>

      {formError ? <p className="mt-3 rounded-xl border border-[#f28f8f]/20 bg-[#f28f8f]/10 px-3 py-2.5 text-sm text-[#ffb0b0]" role="alert">{formError}</p> : null}

      <button className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#c9f27b] px-4 py-3 text-sm font-semibold text-[#1a2415] transition-colors hover:bg-[#d5f896] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
        {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Add activity'}
      </button>
    </form>
  )
}

export default ActivityForm
