import { NextRequest, NextResponse } from "next/server"
import { TodoService } from "@/server/services/todo.service"
import { ApiResponse } from "@/lib/api/response"

export const TodoController = {
  async getAll() {
    try {
      const todos = await TodoService.findAll()
      return NextResponse.json(ApiResponse.success(todos), { status: 200 })
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
      const todo = await TodoService.create(body)
      return NextResponse.json(ApiResponse.success(todo), { status: 201 })
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
      const todo = await TodoService.update(id, body)
      return NextResponse.json(ApiResponse.success(todo), { status: 200 })
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
      await TodoService.delete(id)
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
