import { NextResponse } from "next/server"
import { ApiResponse } from "./response"

export function handleApiError(
  error: unknown,
  defaultMessage: string,
  status = 500
) {
  const message = error instanceof Error ? error.message : defaultMessage
  return NextResponse.json(ApiResponse.error(message), { status })
}
