import type { QueryClient, QueryKey } from "@tanstack/react-query"
import type { Paginated } from "../types"
import type { VersionedEntity } from "./types"

export function upsertInPaginatedCaches<T extends VersionedEntity>(
  qc: QueryClient,
  listQueryKeyRoot: QueryKey,
  item: T,
): void {
  qc.setQueriesData<Paginated<T>>(
    { queryKey: listQueryKeyRoot, exact: false },
    (old) => {
      if (!old?.data) return old
      return {
        ...old,
        data: old.data.map((row) =>
          row.id === item.id ? { ...row, ...item } as T : row,
        ),
      }
    },
  )
}

export function upsertInListCaches<T extends VersionedEntity>(
  qc: QueryClient,
  listQueryKeyRoot: QueryKey,
  item: T,
): void {
  qc.setQueriesData<{
    data: T[]
    meta: unknown
  }>({ queryKey: listQueryKeyRoot, exact: false }, (old) => {
    if (!old?.data) return old
    return {
      ...old,
      data: old.data.map((row) =>
        row.id === item.id ? { ...row, ...item } as T : row,
      ),
    }
  })
}

export function removeFromPaginatedCaches(
  qc: QueryClient,
  listQueryKeyRoot: QueryKey,
  id: string,
): void {
  qc.setQueriesData<Paginated<VersionedEntity>>(
    { queryKey: listQueryKeyRoot, exact: false },
    (old) => {
      if (!old?.data) return old
      return {
        ...old,
        data: old.data.filter((row) => row.id !== id),
      }
    },
  )
}

export function removeFromListCaches(
  qc: QueryClient,
  listQueryKeyRoot: QueryKey,
  id: string,
): void {
  qc.setQueriesData<{
    data: VersionedEntity[]
    meta: unknown
  }>({ queryKey: listQueryKeyRoot, exact: false }, (old) => {
    if (!old?.data) return old
    return {
      ...old,
      data: old.data.filter((row) => row.id !== id),
    }
  })
}
