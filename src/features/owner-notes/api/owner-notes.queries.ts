import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import type { WriteRequest } from "@/shared/api/write-safety"
import * as api from "./owner-notes.api"
import type {
  OwnerNoteInput,
  OwnerNotesListParams,
  OwnerNoteUpdate,
} from "./owner-notes.types"

export const ownerNotesKeys = {
  all: ["owner-notes"] as const,
  list: (params: OwnerNotesListParams) =>
    [...ownerNotesKeys.all, "list", params] as const,
}

// Both lists (open and done) and the dashboard's counts change with any write.
function invalidateOwnerNotes(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: ownerNotesKeys.all })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
}

/** Page, page size and search from the URL; `done` picks the list. */
export function useOwnerNotesListParams(done: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo<OwnerNotesListParams>(() => {
    const base = parseListParams(searchParams, { limit: 20 })
    return {
      page: base.page,
      limit: base.limit,
      search: base.search || undefined,
      done,
    }
  }, [searchParams, done])
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  return { params, setParam, setPage, setLimit }
}

export function useOwnerNotesListQuery(params: OwnerNotesListParams) {
  return useQuery({
    queryKey: ownerNotesKeys.list(params),
    queryFn: ({ signal }) => api.listOwnerNotes(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

export function useCreateOwnerNoteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: OwnerNoteInput
      write: WriteRequest
    }) => api.createOwnerNote(input, write),
    onSuccess: () => invalidateOwnerNotes(qc),
  })
}

export function useUpdateOwnerNoteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: OwnerNoteUpdate
      write: WriteRequest
    }) => api.updateOwnerNote(id, input, write),
    onSuccess: () => invalidateOwnerNotes(qc),
  })
}

type DeleteArgs = {
  id: string
  version: number
}

export function useDeleteOwnerNoteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, version }: DeleteArgs) =>
      api.deleteOwnerNote(id, { ifMatch: version }),
    onSuccess: () => invalidateOwnerNotes(qc),
  })
}
