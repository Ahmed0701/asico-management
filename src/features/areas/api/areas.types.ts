export type Area = {
  id: string
  name: string
  city: string
  villaCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type AreaOption = {
  id: string
  name: string
  city: string
}

export type AreasListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
}

export type AreasListResponse = {
  data: Area[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type CreateAreaInput = {
  name: string
  city: string
}

export type UpdateAreaInput = {
  name?: string
  city?: string
}
