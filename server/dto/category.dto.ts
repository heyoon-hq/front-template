import { z } from "@/lib/zod-config"
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category"

// Request DTOs (기존 스키마 재사용)
export const createCategoryDtoSchema = z.object({
  name: z.string().min(1, "카테고리 이름을 입력해주세요").max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "올바른 색상 코드를 입력해주세요").optional(),
})
export type CreateCategoryDto = z.infer<typeof createCategoryDtoSchema>

export const updateCategoryDtoSchema = updateCategorySchema.omit({ id: true })
export type UpdateCategoryDto = z.infer<typeof updateCategoryDtoSchema>

// Response DTO
export const categoryResponseDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  createdAt: z.date(),
})
export type CategoryResponseDto = z.infer<typeof categoryResponseDtoSchema>
