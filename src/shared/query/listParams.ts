export type ListParams = {
  page: number
  limit: number
  sort?: string
  search?: string
  [key: string]: string | number | undefined
}

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20

export function parseListParams(
  searchParams: URLSearchParams,
  defaults: Partial<ListParams> = {},
): ListParams {
  const pageRaw =
    searchParams.get("page") ?? String(defaults.page ?? DEFAULT_PAGE)
  const limitRaw =
    searchParams.get("limit") ?? String(defaults.limit ?? DEFAULT_LIMIT)
  const page = Math.max(1, Number.parseInt(pageRaw, 10) || DEFAULT_PAGE)
  const limit = Math.max(1, Number.parseInt(limitRaw, 10) || DEFAULT_LIMIT)
  const sort = searchParams.get("sort") ?? defaults.sort
  const search = searchParams.get("search") ?? defaults.search

  const out: ListParams = { page, limit, sort, search }
  searchParams.forEach((value, key) => {
    if (key === "page" || key === "limit" || key === "sort" || key === "search")
      return
    out[key] = value
  })
  return out
}

export function setListParam(
  prev: URLSearchParams,
  key: string,
  value: string | number | undefined | null,
): URLSearchParams {
  const next = new URLSearchParams(prev)
  if (value === undefined || value === null || value === "") {
    next.delete(key)
  } else {
    next.set(key, String(value))
  }
  if (key !== "page") next.set("page", "1")
  return next
}

export function paginateSlice<T>(items: T[], page: number, limit: number): {
  data: T[]
  meta: ListParams & {
    total: number
    totalPages: number
  }
} {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * limit
  const data = items.slice(start, start + limit)
  return {
    data,
    meta: { page: safePage, limit, total, totalPages },
  }
}

export const MOCK_DELAY_MS = 450

export function mockDelay(ms = MOCK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
