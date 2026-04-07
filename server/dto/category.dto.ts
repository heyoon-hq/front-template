import type { z } from "@/lib/zod-config"
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category"

// Request DTOs (기존 스키마 재사용)
export const createCategoryDtoSchema = createCategorySchema
export type CreateCategoryDto = z.input<typeof createCategoryDtoSchema>

export const updateCategoryDtoSchema = updateCategorySchema.omit({ id: true })
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>
