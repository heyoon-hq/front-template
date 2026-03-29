import "@/lib/zod-config"
import { prisma } from "@/server/db/prisma"
import {
  createTodoDtoSchema,
  updateTodoDtoSchema,
} from "@/server/dto/todo.dto"
import type { CreateTodoDto, UpdateTodoDto } from "@/server/dto/todo.dto"

export const TodoService = {
  async findAll() {
    try {
      return await prisma.todo.findMany({
        orderBy: [
          { dueDate: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        include: { category: true },
      })
    } catch (error) {
      throw new Error("할 일 목록을 조회할 수 없습니다")
    }
  },

  async create(data: CreateTodoDto) {
    const parsed = createTodoDtoSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message)
    }

    try {
      return await prisma.todo.create({
        data: {
          title: parsed.data.title,
          categoryId: parsed.data.categoryId ?? null,
          dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        },
        include: { category: true },
      })
    } catch (error) {
      throw new Error("할 일을 생성할 수 없습니다")
    }
  },

  async update(id: string, data: UpdateTodoDto) {
    const parsed = updateTodoDtoSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0].message)
    }

    const { dueDate, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }

    try {
      return await prisma.todo.update({
        where: { id },
        data: updateData,
        include: { category: true },
      })
    } catch (error) {
      throw new Error("할 일을 찾을 수 없습니다")
    }
  },

  async delete(id: string) {
    try {
      await prisma.todo.delete({
        where: { id },
      })
    } catch (error) {
      throw new Error("할 일을 찾을 수 없습니다")
    }
  },
}
