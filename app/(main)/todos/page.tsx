import type { Metadata } from "next";
import { getTodos } from "@/server/actions/todo";
import { getCategories } from "@/server/actions/category";
import { TodoForm } from "@/components/todo/todo-form";
import { TodoFilteredList } from "@/components/todo/todo-filtered-list";

export const metadata: Metadata = {
  title: "할일 관리 | My App",
  description: "Todo 목록을 관리하세요",
};

export default async function TodosPage() {
  const [todos, categories] = await Promise.all([getTodos(), getCategories()]);

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">할일 관리</h1>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            새 할일
          </h2>
          <TodoForm initialCategories={categories} />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            할일 목록
          </h2>
          <TodoFilteredList
            initialTodos={todos}
            initialCategories={categories}
          />
        </div>
      </div>
    </div>
  );
}
