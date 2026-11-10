export type ApiSuccess<T> = { data: T }

export type ErrorDetail = {
  path: string
  message: string
  value?: unknown
}

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: ErrorDetail[]
  }
}

/** Flat error shape from the running API (`errorHandler.ts`). */
export type ApiErrorFlatBody = {
  code: string
  message: string
  details?: ErrorDetail[]
  requestId?: string
}

export type ApiError = {
  status: number
  code: string
  message: string
  details?: ErrorDetail[]
  requestId?: string
}

export type PaginatedMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type Paginated<T,> = {
  data: T[]
  meta: PaginatedMeta
}
