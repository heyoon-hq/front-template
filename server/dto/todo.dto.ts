import { z } from "zod/v4"
import { createTodoSchema, updateTodoSchema } from "@/lib/validations/todo"

// Request DTOs (기존 스키마 재사용)
export const createTodoDtoSchema = createTodoSchema
export type CreateTodoDto = z.infer<typeof createTodoDtoSchema>

export const updateTodoDtoSchema = updateTodoSchema.omit({ id: true })
export type UpdateTodoDto = z.infer<typeof updateTodoDtoSchema>

// Response DTO
export const todoResponseDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  categoryId: z.string().nullable(),
  dueDate: z.date().nullable(),
  createdAt: z.date(),
  category: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })
    .nullable()
    .optional(),
})
export type TodoResponseDto = z.infer<typeof todoResponseDtoSchema>
