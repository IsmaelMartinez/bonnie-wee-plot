import { MONTH_NAMES_SHORT, type Month } from '@/types/garden-planner'

export default function MonthBar({
  label,
  months,
  color,
}: {
  label: string
  months: Month[]
  color: string
}) {
  if (months.length === 0) return null
  const allMonths: Month[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zen-ink-600 w-20 sm:w-28 shrink-0">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {allMonths.map(m => (
          <div
            key={m}
            className={`h-6 flex-1 rounded-sm text-[10px] flex items-center justify-center ${
              months.includes(m) ? color : 'bg-zen-stone-100 text-zen-stone-400'
            }`}
            title={MONTH_NAMES_SHORT[m]}
          >
            {MONTH_NAMES_SHORT[m][0]}
          </div>
        ))}
      </div>
    </div>
  )
}
