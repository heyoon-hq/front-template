import { NextResponse } from "next/server"
import { createErrorResponse } from "./response"

export function handleApiError(
  error: unknown,
  defaultMessage: string,
  status = 500
) {
  const message = error instanceof Error ? error.message : defaultMessage
  return NextResponse.json(createErrorResponse(message), { status })
}
