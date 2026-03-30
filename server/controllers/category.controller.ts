import { NextRequest, NextResponse } from "next/server"
import { CategoryService } from "@/server/services/category.service"
import { ApiResponse } from "@/lib/api/response"

export const CategoryController = {
  async getAll() {
    try {
      const categories = await CategoryService.findAll()
      return NextResponse.json(ApiResponse.success(categories), { status: 200 })
    } catch (error) {
      return NextResponse.json(
        ApiResponse.error(
          error instanceof Error ? error.message : "서버 오류"
        ),
        { status: 500 }
      )
    }
  },

  async create(request: NextRequest) {
    try {
      const body = await request.json()
      const category = await CategoryService.create(body)
      return NextResponse.json(ApiResponse.success(category), { status: 201 })
    } catch (error) {
      return NextResponse.json(
        ApiResponse.error(
          error instanceof Error ? error.message : "생성 실패"
        ),
        { status: 400 }
      )
    }
  },

  async update(id: string, request: NextRequest) {
    try {
      const body = await request.json()
      const category = await CategoryService.update(id, body)
      return NextResponse.json(ApiResponse.success(category), { status: 200 })
    } catch (error) {
      return NextResponse.json(
        ApiResponse.error(
          error instanceof Error ? error.message : "수정 실패"
        ),
        { status: 404 }
      )
    }
  },

  async delete(id: string) {
    try {
      await CategoryService.delete(id)
      return NextResponse.json(ApiResponse.success(null), { status: 200 })
    } catch (error) {
      return NextResponse.json(
        ApiResponse.error(
          error instanceof Error ? error.message : "삭제 실패"
        ),
        { status: 404 }
      )
    }
  },
}
