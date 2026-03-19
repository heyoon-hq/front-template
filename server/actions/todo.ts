"use server"

import { TodoService } from "@/server/services/todo.service"
import { deleteTodoSchema } from "@/lib/validations/todo"

type ActionResult = { success: true } | { success: false; error: string }

export async function getTodos() {
  return TodoService.findAll()
}

export async function createTodo(formData: FormData): Promise<ActionResult> {
  const categoryId = formData.get("categoryId") as string | null
  const dueDate = formData.get("dueDate") as string | null

  try {
    await TodoService.create({
      title: formData.get("title") as string,
      categoryId: categoryId || undefined,
      dueDate: dueDate || undefined,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "할 일을 생성할 수 없습니다",
    }
  }
}

export async function updateTodo(
  data: { id: string; title?: string; completed?: boolean; categoryId?: string | null; dueDate?: string | null }
): Promise<ActionResult> {
  try {
    const { id, ...updateData } = data
    await TodoService.update(id, updateData)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "할 일을 찾을 수 없습니다",
    }
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
    await TodoService.delete(parsed.data.id)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "할 일을 찾을 수 없습니다",
    }
  }
}
