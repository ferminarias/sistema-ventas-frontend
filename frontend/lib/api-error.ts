export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const error = await response.json().catch(() => ({}))
    return new ApiError(
      error.message || `Error: ${response.status} ${response.statusText}`,
      response.status
    )
  }
} 