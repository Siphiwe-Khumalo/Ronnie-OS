import type { Activity } from '../types/activity'
import { activityCategoryLabels, formatActivityDate, formatActivityTime } from '../utils/activity'

interface ActivityCardProps {
  activity: Activity
  isDeleting: boolean
  onDelete: (activity: Activity) => void
  onEdit: (activity: Activity) => void
  showDate?: boolean
}

function ActivityCard({ activity, isDeleting, onDelete, onEdit, showDate = false }: ActivityCardProps) {
  return (
    <article className="group relative pl-10">
      <span className="absolute left-0 top-5 grid size-5 -translate-x-1/2 place-items-center rounded-full border-4 border-[#101311] bg-[#c9f27b]" />
      <div className="rounded-2xl border border-white/10 bg-[#181d19] p-4 transition-colors hover:border-white/15 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#899188]">
              {showDate ? <span>{formatActivityDate(activity.timestamp)}</span> : null}
              <time dateTime={activity.timestamp}>{formatActivityTime(activity.timestamp)}</time>
              <span aria-hidden="true" className="text-[#687168]">·</span>
              <span className="text-[#c9f27b]">{activityCategoryLabels[activity.category]}</span>
              {activity.durationMinutes !== undefined ? (
                <>
                  <span aria-hidden="true" className="text-[#687168]">·</span>
                  <span>{activity.durationMinutes} min</span>
                </>
              ) : null}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-6 text-[#f3f5ef]">{activity.note}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <button className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#899188] transition-colors hover:bg-white/5 hover:text-[#f3f5ef]" onClick={() => onEdit(activity)} type="button">
              Edit
            </button>
            <button className="rounded-lg px-2.5 py-2 text-xs font-medium text-[#ffb0b0] transition-colors hover:bg-[#f28f8f]/10 disabled:cursor-not-allowed disabled:opacity-60" disabled={isDeleting} onClick={() => onDelete(activity)} type="button">
              {isDeleting ? '…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export default ActivityCard
