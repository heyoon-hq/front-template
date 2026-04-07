import type { Metadata } from "next"
import { getCategories } from "@/server/actions/category"
import { CategoryForm } from "@/components/category/category-form"
import { CategoryList } from "@/components/category/category-list"

export const metadata: Metadata = {
  title: "카테고리 관리 | My App",
  description: "카테고리를 관리하세요",
}

export default async function CategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="flex min-h-screen items-start justify-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">카테고리 관리</h1>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            새 카테고리
          </h2>
          <CategoryForm />
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            카테고리 목록
          </h2>
          <CategoryList initialCategories={categories} />
        </div>
      </div>
    </div>
  )
}
