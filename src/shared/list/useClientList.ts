import { useMemo, useState } from "react"

export function useClientList<T>({
  items,
  pageSize = 20,
  search,
  searchFields,
  sort,
}: {
  items: T[]
  pageSize?: number
  search: string
  searchFields: (item: T) => string[]
  sort?: {
    field: string
    direction: "asc" | "desc"
  }
}) {
  const [page, setPage] = useState(1)
  const q = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    let rows = items
    if (q) {
      rows = rows.filter((item) =>
        searchFields(item).some((f) => f.toLowerCase().includes(q)),
      )
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sort.field] ?? "")
        const bv = String((b as Record<string, unknown>)[sort.field] ?? "")
        const cmp = av.localeCompare(bv, undefined, { numeric: true })
        return sort.direction === "asc" ? cmp : -cmp
      })
    }
    return rows
  }, [items, q, searchFields, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return {
    rows: slice,
    total: filtered.length,
    page: safePage,
    pageSize,
    setPage,
    totalPages,
  }
}
