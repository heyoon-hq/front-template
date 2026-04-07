"use client"

import { useMemo, useState } from "react"
import { useTodos } from "@/hooks/use-todos"
import { useCategories } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"
import { DateGroupHeader } from "./date-group-header"
import { TodoFilter } from "./todo-filter"
import { TodoItem } from "./todo-item"

type Category = {
  id: string
  name: string
  color: string
  createdAt: Date | string
}

type TodoFilterValue = "all" | "active" | "completed"

type TodoWithCategory = {
  id: string
  title: string
  completed: boolean
  dueDate: Date | string | null
  categoryId: string | null
  category?: {
    id: string
    name: string
    color: string
  } | null
  createdAt: Date | string
  updatedAt: Date | string
}

type TodoFilteredListProps = {
  initialTodos: TodoWithCategory[]
  initialCategories: Category[]
}

export function TodoFilteredList({ initialTodos, initialCategories }: TodoFilteredListProps) {
  const { data: todos = [] } = useTodos(initialTodos)
  const { data: categories = [] } = useCategories(initialCategories)
  const [filter, setFilter] = useState<TodoFilterValue>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const completedCount = todos.filter((t) => t.completed).length
  const activeCount = todos.length - completedCount

  const filteredTodos = useMemo(() =>
    todos.filter((todo) => {
      if (filter === "active" && todo.completed) return false
      if (filter === "completed" && !todo.completed) return false
      if (categoryFilter === "none" && todo.categoryId !== null) return false
      if (categoryFilter !== "all" && categoryFilter !== "none" && todo.categoryId !== categoryFilter) return false
      return true
    }),
    [todos, filter, categoryFilter]
  )

  const groupedTodos = useMemo(() => {
    const groups = new Map<string, TodoWithCategory[]>()
    for (const todo of filteredTodos) {
      const key = todo.dueDate
        ? new Date(todo.dueDate).toISOString().split("T")[0]
        : "unset"
      const list = groups.get(key)
      if (list) {
        list.push(todo)
      } else {
        groups.set(key, [todo])
      }
    }
    return Array.from(groups.entries())
  }, [filteredTodos])

  if (todos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        할 일이 없습니다. 새로운 할 일을 추가해보세요!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <TodoFilter
        current={filter}
        onChange={setFilter}
        counts={{ all: todos.length, active: activeCount, completed: completedCount }}
      />
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-muted text-muted-foreground hover:border-primary/50"
            }`}
          >
            전체
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryFilter("none")}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "none"
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-muted text-muted-foreground hover:border-primary/50"
            }`}
          >
            무소속
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="ghost"
              size="sm"
              onClick={() => setCategoryFilter(cat.id)}
              className="rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
              style={{
                borderColor: categoryFilter === cat.id ? cat.color : "var(--border)",
                backgroundColor: categoryFilter === cat.id ? `${cat.color}33` : "var(--muted)",
                color: categoryFilter === cat.id ? cat.color : "var(--muted-foreground)",
              }}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}
      <div className="space-y-4">
        {filteredTodos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {filter === "active" ? "진행 중인 할 일이 없습니다" : filter === "completed" ? "완료된 할 일이 없습니다" : "해당하는 할 일이 없습니다"}
          </p>
        ) : (
          groupedTodos.map(([dateKey, items]) => (
            <div key={dateKey} className="space-y-2">
              <DateGroupHeader dateKey={dateKey} />
              {items.map((todo) => (
                <TodoItem
                  key={todo.id}
                  id={todo.id}
                  title={todo.title}
                  completed={todo.completed}
                  dueDate={todo.dueDate}
                  category={todo.category}
                  categoryId={todo.categoryId}
                  categories={categories}
                />
              ))}
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center gap-4 border-t pt-3 text-xs text-muted-foreground">
        <span>전체 {todos.length}</span>
        <span>진행 중 {activeCount}</span>
        <span>완료 {completedCount}</span>
      </div>
    </div>
  )
}
