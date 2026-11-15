import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { listMonthlyProgress } from "./monthly-progress.api"
import type { MonthlyProgressParams } from "./monthly-progress.types"

export const monthlyProgressKeys = {
  all: ["monthly-progress"] as const,
  list: (params: MonthlyProgressParams) =>
    [...monthlyProgressKeys.all, "list", params] as const,
}

const SORT_PATTERN = /^(villaNumber|previous|current|change)(:(asc|desc))?$/
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

/** Page, size, month, search and sort from the URL. */
export function useMonthlyProgressParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<MonthlyProgressParams>(() => {
    const base = parseListParams(searchParams, { limit: 50 })
    const sort = searchParams.get("sort") ?? ""
    const month = searchParams.get("month") ?? ""
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      sort: SORT_PATTERN.test(sort) ? sort : undefined,
      month: MONTH_PATTERN.test(month) ? month : undefined,
    }
  }, [searchParams])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  return { params, setParam, setPage, setLimit }
}

export function useMonthlyProgressQuery(params: MonthlyProgressParams) {
  return useQuery({
    queryKey: monthlyProgressKeys.list(params),
    queryFn: ({ signal }) => listMonthlyProgress(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}
