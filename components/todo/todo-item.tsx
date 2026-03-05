"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import type { Category } from "@prisma/client"
import { useUpdateTodo, useDeleteTodo } from "@/hooks/use-todos"
import { cn } from "@/lib/utils"
import { CategoryBadge } from "@/components/category/category-badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type TodoItemProps = {
  id: string
  title: string
  completed: boolean
  dueDate?: Date | null
  category?: { name: string; color: string } | null
  categoryId?: string | null
  categories?: Category[]
}

export function TodoItem({ id, title, completed, dueDate, category, categoryId, categories = [] }: TodoItemProps) {
  const updateMutation = useUpdateTodo()
  const deleteMutation = useDeleteTodo()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [calendarOpen, setCalendarOpen] = useState(false)

  function handleToggle() {
    updateMutation.mutate({ id, completed: !completed })
  }

  function handleDelete() {
    deleteMutation.mutate({ id })
  }

  async function handleCategoryChange(value: string) {
    const newCategoryId = value === "none" ? null : value
    await updateMutation.mutateAsync({ id, categoryId: newCategoryId })
  }

  async function handleDueDateChange(date: Date | undefined) {
    const newDate = date ? format(date, "yyyy-MM-dd") : null
    await updateMutation.mutateAsync({ id, dueDate: newDate })
    setCalendarOpen(false)
  }

  async function handleEditSubmit() {
    if (editTitle.trim() && editTitle !== title) {
      await updateMutation.mutateAsync({ id, title: editTitle.trim() })
    } else {
      setEditTitle(title)
    }
    setIsEditing(false)
  }

  return (
    <div className={cn(
      "relative flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
      completed
        ? "border-muted bg-muted/30"
        : "border-border bg-muted/50 hover:border-primary/40"
    )}>
      <Checkbox
        checked={completed}
        onCheckedChange={handleToggle}
      />

      {isEditing ? (
        <Input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleEditSubmit()
            if (e.key === "Escape") {
              setEditTitle(title)
              setIsEditing(false)
            }
          }}
          className="flex-1"
          autoFocus
        />
      ) : (
        <div className="flex flex-1 items-center gap-2">
          <span
            onDoubleClick={() => setIsEditing(true)}
            className={cn(
              "cursor-pointer text-sm",
              completed && "text-muted-foreground line-through"
            )}
          >
            {title}
          </span>
          {categories.length > 0 && (
            <Select
              value={categoryId ?? "none"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="h-6 w-auto gap-1 border-none bg-transparent px-1.5 text-xs shadow-none">
                <SelectValue>
                  {category ? (
                    <CategoryBadge name={category.name} color={category.color} />
                  ) : (
                    <span className="text-muted-foreground">무소속</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">무소속</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1 text-xs",
              dueDate ? "text-primary" : "text-muted-foreground"
            )}
          >
            <CalendarIcon className="size-3.5" />
            {dueDate ? format(new Date(dueDate), "MM/dd", { locale: ko }) : "날짜"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dueDate ? new Date(dueDate) : undefined}
            onSelect={handleDueDateChange}
            locale={ko}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
      >
        {deleteMutation.isPending ? "..." : "삭제"}
      </Button>
    </div>
  )
}
