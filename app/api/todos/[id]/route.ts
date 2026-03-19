import { NextRequest } from "next/server"
import { TodoController } from "@/server/controllers/todo.controller"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return TodoController.update(id, request)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return TodoController.delete(id)
}
