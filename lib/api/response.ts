export type ApiResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  error: string
}

export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

export function createErrorResponse(error: string): ApiErrorResponse {
  return { success: false, error }
}
