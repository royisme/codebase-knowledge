export type Identifier = string & { readonly brand: unique symbol }

export type ISODateString = string & { readonly isoDate: unique symbol }

export interface Pagination {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface AuditMetadata {
  createdAt: ISODateString
  updatedAt: ISODateString
  createdBy: Identifier
  updatedBy: Identifier
}
