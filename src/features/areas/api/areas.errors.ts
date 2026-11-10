import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onAreasForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}

export type AreaFieldErrors = Partial<Record<"name" | "city" | "sort" | "limit" | "search" | "page", string>>

export function areaFieldErrorsFromApi(error: ApiError): AreaFieldErrors {
  const out: AreaFieldErrors = {}
  if (!error.details?.length) return out
  for (const d of error.details) {
    const path = d.path as keyof AreaFieldErrors
    if (path) out[path] = d.message
  }
  return out
}
