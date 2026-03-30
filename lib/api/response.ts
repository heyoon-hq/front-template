export type ApiSuccessResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  error: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export const ApiResponse = {
  success: <T>(data: T): ApiSuccessResponse<T> => ({ success: true, data }),
  error: (error: string): ApiErrorResponse => ({ success: false, error }),
}
