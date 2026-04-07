import type { z } from "@/lib/zod-config"
import { createTodoSchema, updateTodoSchema } from "@/lib/validations/todo"

// Request DTOs (기존 스키마 재사용)
export const createTodoDtoSchema = createTodoSchema
export type CreateTodoDto = z.infer<typeof createTodoDtoSchema>

export const updateTodoDtoSchema = updateTodoSchema.omit({ id: true })
export type UpdateTodoDto = z.infer<typeof updateTodoDtoSchema>
