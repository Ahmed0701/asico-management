import type { PaginatedMeta } from "@/shared/api/types"

export type UserRole = "ADMIN" | "EMPLOYEE"

export type UserListItem = {
  id: string
  version: number
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export type UserDetail = UserListItem & { permissions: string[] }

export type UsersListParams = {
  page: number
  limit: number
  sort?: string
  role?: UserRole
  isActive?: boolean
  search?: string
}

export type CreateUserInput = {
  name: string
  email: string
  password: string
  isActive?: boolean
  permissions?: string[]
}

export type UpdateUserInput = {
  name?: string
  email?: string
}

export type UsersListResponse = {
  data: UserListItem[]
  meta: PaginatedMeta
}
