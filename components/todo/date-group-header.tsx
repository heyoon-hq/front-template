type DateGroupHeaderProps = {
  dateKey: string
}

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

function formatDateLabel(dateKey: string): string {
  if (dateKey === "unset") return "마감일 없음"

  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  if (dateKey === todayStr) return "오늘"
  if (dateKey === yesterdayStr) return "어제"

  const date = new Date(dateKey + "T00:00:00")
  const dayName = DAY_NAMES[date.getDay()]
  return `${dateKey} [${dayName}]`
}

export function DateGroupHeader({ dateKey }: DateGroupHeaderProps) {
  return (
    <h3 className="border-b pb-1 text-xs font-semibold text-muted-foreground">
      {formatDateLabel(dateKey)}
    </h3>
  )
}
