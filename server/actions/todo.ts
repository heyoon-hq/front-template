"use server"

import { prisma } from "@/server/db/prisma"
import {
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
} from "@/lib/validations/todo"
type ActionResult = { success: true } | { success: false; error: string }

export async function getTodos() {
  return prisma.todo.findMany({
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: { category: true },
  })
}

export async function createTodo(formData: FormData): Promise<ActionResult> {
  const categoryId = formData.get("categoryId") as string | null
  const dueDate = formData.get("dueDate") as string | null
  const parsed = createTodoSchema.safeParse({
    title: formData.get("title"),
    categoryId: categoryId || undefined,
    dueDate: dueDate || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await prisma.todo.create({
      data: {
        title: parsed.data.title,
        categoryId: parsed.data.categoryId ?? null,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: "할 일을 생성할 수 없습니다" }
  }
}

export async function updateTodo(
  data: { id: string; title?: string; completed?: boolean; categoryId?: string | null; dueDate?: string | null }
): Promise<ActionResult> {
  const parsed = updateTodoSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const { id, dueDate, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    await prisma.todo.update({
      where: { id },
      data: updateData,
    })

    return { success: true }
  } catch {
    return { success: false, error: "할 일을 찾을 수 없습니다" }
  }
}

export async function deleteTodo(
  data: { id: string }
): Promise<ActionResult> {
  const parsed = deleteTodoSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    await prisma.todo.delete({
      where: { id: parsed.data.id },
    })

    return { success: true }
  } catch {
    return { success: false, error: "할 일을 찾을 수 없습니다" }
  }
}
