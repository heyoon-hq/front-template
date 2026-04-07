import { NextRequest } from "next/server"
import { TodoController } from "@/server/controllers/todo.controller"

export async function GET() {
  return TodoController.getAll()
}

export async function POST(request: NextRequest) {
  return TodoController.create(request)
}
