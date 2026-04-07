import { prisma } from "@/server/db/prisma"
import {
  createCategoryDtoSchema,
  updateCategoryDtoSchema,
} from "@/server/dto/category.dto"
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
} from "@/server/dto/category.dto"

export const CategoryService = {
  async findAll() {
    try {
      return await prisma.category.findMany({
        orderBy: { createdAt: "asc" },
      })
    } catch (error) {
      console.error("[CategoryService.findAll]", error)
      throw new Error("카테고리 목록을 조회할 수 없습니다")
    }
  },

  async create(data: CreateCategoryDto) {
    const parsed = createCategoryDtoSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message)
    }

    try {
      return await prisma.category.create({
        data: {
          name: parsed.data.name,
          color: parsed.data.color,
        },
      })
    } catch (error) {
      console.error("[CategoryService.create]", error)
      throw new Error("이미 존재하는 카테고리입니다")
    }
  },

  async update(id: string, data: UpdateCategoryDto) {
    const parsed = updateCategoryDtoSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message)
    }

    try {
      return await prisma.category.update({
        where: { id },
        data: parsed.data,
      })
    } catch (error) {
      console.error("[CategoryService.update]", error)
      throw new Error("카테고리를 찾을 수 없습니다")
    }
  },

  async delete(id: string) {
    try {
      await prisma.category.delete({
        where: { id },
      })
    } catch (error) {
      console.error("[CategoryService.delete]", error)
      throw new Error("카테고리를 찾을 수 없습니다")
    }
  },
}
