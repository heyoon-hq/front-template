"use client"

import { useRef, useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { useCreateTodo } from "@/hooks/use-todos"
import { useCategories } from "@/hooks/use-categories"
import { CategorySelect } from "@/components/category/category-select"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Category = {
  id: string
  name: string
  color: string
  createdAt: Date | string
}

type TodoFormProps = {
  initialCategories: Category[]
}

export function TodoForm({ initialCategories }: TodoFormProps) {
  const { data: categories = [] } = useCategories(initialCategories)
  const createTodoMutation = useCreateTodo()
  const formRef = useRef<HTMLFormElement>(null)
  const [categoryId, setCategoryId] = useState("")
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    const title = formData.get("title") as string
    if (!title) return

    await createTodoMutation.mutateAsync({
      title,
      categoryId: categoryId || undefined,
      dueDate: format(dueDate, "yyyy-MM-dd"),
    })

    formRef.current?.reset()
    setCategoryId("")
    setDueDate(new Date())
  }

  return (
    <div className="space-y-2">
      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          name="title"
          placeholder="할 일을 입력..."
          className="flex-1"
          autoComplete="off"
        />
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="size-4" />
              {format(dueDate, "yyyy-MM-dd")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => {
                if (date) {
                  setDueDate(date)
                  setCalendarOpen(false)
                }
              }}
              locale={ko}
            />
          </PopoverContent>
        </Popover>
        <CategorySelect
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
        />
        <Button
          type="submit"
          disabled={createTodoMutation.isPending}
        >
          {createTodoMutation.isPending ? "..." : "추가"}
        </Button>
      </form>
      {createTodoMutation.error && (
        <p className="text-sm text-destructive">{createTodoMutation.error.message}</p>
      )}
    </div>
  )
}
