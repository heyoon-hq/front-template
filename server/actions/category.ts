"use server"

import type { ActionResult } from "@/server/actions/types"
import { CategoryService } from "@/server/services/category.service"
import { deleteCategorySchema } from "@/lib/validations/category"

export async function getCategories() {
  return CategoryService.findAll()
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const nameValue = formData.get("name")
  const colorValue = formData.get("color")

  if (!nameValue) {
    return { success: false, error: "이름을 입력해주세요" }
  }

  try {
    await CategoryService.create({
      name: String(nameValue),
      ...(colorValue ? { color: String(colorValue) } : {}),
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "이미 존재하는 카테고리입니다",
    }
  }
}

export async function updateCategory(
  data: { id: string; name?: string; color?: string }
): Promise<ActionResult> {
  try {
    const { id, ...updateData } = data
    await CategoryService.update(id, updateData)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "카테고리를 찾을 수 없습니다",
    }
  }
}

export async function deleteCategory(
  data: { id: string }
): Promise<ActionResult> {
  const parsed = deleteCategorySchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await CategoryService.delete(parsed.data.id)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "카테고리를 찾을 수 없습니다",
    }
  }
}
