import { NextRequest } from "next/server"
import { CategoryController } from "@/server/controllers/category.controller"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return CategoryController.update(id, request)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  return CategoryController.delete(id)
}
