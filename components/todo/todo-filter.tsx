"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type TodoFilter = "all" | "active" | "completed"

type TodoFilterProps = {
  current: TodoFilter
  onChange: (filter: TodoFilter) => void
  counts: { all: number; active: number; completed: number }
}

const filters: { value: TodoFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active", label: "진행 중" },
  { value: "completed", label: "완료" },
]

export function TodoFilter({ current, onChange, counts }: TodoFilterProps) {
  return (
    <div className="flex gap-1 rounded-lg border bg-muted p-1">
      {filters.map(({ value, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(value)}
          className={cn(
            "flex-1 px-3 py-1.5 text-xs font-bold transition-colors",
            current === value
              ? "border border-primary bg-primary/20 text-primary"
              : "border border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {label} ({counts[value]})
        </Button>
      ))}
    </div>
  )
}
