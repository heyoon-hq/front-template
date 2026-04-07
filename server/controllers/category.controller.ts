import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "@/server/services/category.service"
import { ApiResponse } from "@/lib/api/response"
import { handleApiError } from "@/lib/api/error-handler"

export const CategoryController = {
  async getAll() {
    try {
      const categories = await CategoryService.findAll()
      return NextResponse.json(ApiResponse.success(categories), { status: 200 })
    } catch (error) {
      return handleApiError(error, "서버 오류", 500)
    }
  },

  async create(request: NextRequest) {
    try {
      const body = await request.json()
      const category = await CategoryService.create(body)
      return NextResponse.json(ApiResponse.success(category), { status: 201 })
    } catch (error) {
      return handleApiError(error, "생성 실패", 400)
    }
  },

  async update(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const category = await CategoryService.update(id, body)
      return NextResponse.json(ApiResponse.success(category), { status: 200 })
    } catch (error) {
      return handleApiError(error, "수정 실패", 404)
    }
  },

  async delete(id: string) {
    try {
      await CategoryService.delete(id)
      return NextResponse.json(ApiResponse.success(null), { status: 200 })
    } catch (error) {
      return handleApiError(error, "삭제 실패", 404)
    }
  },
}
