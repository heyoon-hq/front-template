"use client"

import type { Category } from "@prisma/client"
import { useCategories, useDeleteCategory } from "@/hooks/use-categories"
import { Button } from "@/components/ui/button"

type CategoryListProps = {
  initialCategories: Category[]
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const { data: categories = [] } = useCategories(initialCategories)
  const deleteMutation = useDeleteCategory()

  if (categories.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        -- 길드를 생성해보세요 --
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <div
          key={category.id}
          className="inline-flex items-center gap-1.5 border-2 px-3 py-1 text-sm"
          style={{
            borderColor: `${category.color}60`,
            backgroundColor: `${category.color}15`,
            color: category.color,
          }}
        >
          <span
            className="h-2 w-2"
            style={{ backgroundColor: category.color }}
          />
          {category.name}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => deleteMutation.mutate({ id: category.id })}
            disabled={deleteMutation.isPending}
            className="ml-0.5 text-current hover:bg-white/10"
          >
            &times;
          </Button>
        </div>
      ))}
    </div>
  )
}
