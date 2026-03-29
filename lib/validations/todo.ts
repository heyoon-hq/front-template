import { z } from "zod/v4"

export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, "할 일을 입력해주세요")
    .max(200),
  categoryId: z.string().optional(),
  dueDate: z.string().optional(),
})

export const updateTodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
})

export const deleteTodoSchema = z.object({
  id: z.string(),
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
