"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Category = {
  id: string
  name: string
  color: string
  createdAt: Date | string
}

type CategorySelectProps = {
  categories: Category[]
  value: string
  onChange: (value: string) => void
}

export function CategorySelect({ categories, value, onChange }: CategorySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="카테고리 없음" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">카테고리 없음</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
