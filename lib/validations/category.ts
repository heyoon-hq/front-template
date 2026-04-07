import { z } from "@/lib/zod-config"

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "카테고리 이름을 입력해주세요")
    .max(30),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "올바른 색상 코드를 입력해주세요")
    .optional()
    .default("#6B7280"),
})

export const updateCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(30).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

export const deleteCategorySchema = z.object({
  id: z.string(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
