import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onEngineersForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}

export type EngineerFieldErrors = Partial<Record<"name" | "phone" | "sort" | "limit" | "search" | "page", string>>

export function engineerFieldErrorsFromApi(
  error: ApiError,
): EngineerFieldErrors {
  const out: EngineerFieldErrors = {}
  if (!error.details?.length) return out
  for (const d of error.details) {
    const path = d.path as keyof EngineerFieldErrors
    if (path) out[path] = d.message
  }
  return out
}
