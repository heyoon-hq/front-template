import Link from "next/link"
import { getTodos } from "@/server/actions/todo"
import { getCategories } from "@/server/actions/category"
import { TodoForm } from "@/components/todo/todo-form"
import { TodoFilteredList } from "@/components/todo/todo-filtered-list"
import { CategoryForm } from "@/components/category/category-form"
import { CategoryList } from "@/components/category/category-list"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const [todos, categories] = await Promise.all([
    getTodos(),
    getCategories(),
  ])

  return (
    <div className="flex min-h-screen items-start justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">My App</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            할일과 카테고리를 관리하세요
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Categories
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/categories">전체 보기 →</Link>
            </Button>
          </div>
          <CategoryForm />
          <div className="mt-3">
            <CategoryList initialCategories={categories} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              New Todo
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/todos">전체 보기 →</Link>
            </Button>
          </div>
          <TodoForm initialCategories={categories} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Todos
          </h2>
          <TodoFilteredList initialTodos={todos} initialCategories={categories} />
        </div>
      </div>
    </div>
  )
}
