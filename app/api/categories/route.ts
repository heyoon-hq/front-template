import { NextRequest } from "next/server"
import { CategoryController } from "@/server/controllers/category.controller"

export async function GET() {
  return CategoryController.getAll()
}

export async function POST(request: NextRequest) {
  return CategoryController.create(request)
}
