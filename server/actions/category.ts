"use server"

import { prisma } from "@/server/db/prisma"
import {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
} from "@/lib/validations/category"

type ActionResult = { success: true } | { success: false; error: string }

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  })
}

export async function createCategory(formData: FormData): Promise<ActionResult> {
  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color") || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await prisma.category.create({
      data: { name: parsed.data.name, color: parsed.data.color },
    })

    return { success: true }
  } catch {
    return { success: false, error: "이미 존재하는 카테고리입니다" }
  }
}

export async function updateCategory(
  data: { id: string; name?: string; color?: string }
): Promise<ActionResult> {
  const parsed = updateCategorySchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const { id, ...updateData } = parsed.data
    await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return { success: true }
  } catch {
    return { success: false, error: "카테고리를 찾을 수 없습니다" }
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
    await prisma.category.delete({
      where: { id: parsed.data.id },
    })

    return { success: true }
  } catch {
    return { success: false, error: "카테고리를 찾을 수 없습니다" }
  }
}
