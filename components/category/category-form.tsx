"use client"

import { useRef, useState } from "react"
import { useCreateCategory } from "@/hooks/use-categories"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PRESET_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
]

export function CategoryForm() {
  const createMutation = useCreateCategory()
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[6])

  function handleSubmit(formData: FormData) {
    const name = formData.get("name") as string
    if (!name) return

    createMutation.mutate(
      { name, color: selectedColor },
      {
        onSuccess: () => {
          formRef.current?.reset()
          setSelectedColor(PRESET_COLORS[6])
        },
      }
    )
  }

  return (
    <div className="space-y-2">
      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <div className="flex gap-1">
          {PRESET_COLORS.map((color) => (
            <Button
              key={color}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedColor(color)}
              className={cn(
                "h-8 w-8 border-2 p-0 transition-all",
                selectedColor === color ? "scale-115 border-primary" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Input
          type="text"
          name="name"
          placeholder="카테고리 이름..."
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "..." : "추가"}
        </Button>
      </form>
      {createMutation.error && (
        <p className="text-sm text-destructive">{createMutation.error.message}</p>
      )}
    </div>
  )
}
