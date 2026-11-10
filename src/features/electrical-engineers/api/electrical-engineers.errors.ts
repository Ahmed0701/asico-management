import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onElectricalEngineersForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}

export type ElectricalEngineerFieldErrors = Partial<Record<"name" | "phone" | "sort" | "limit" | "search" | "page", string>>

export function electricalEngineerFieldErrorsFromApi(
  error: ApiError,
): ElectricalEngineerFieldErrors {
  const out: ElectricalEngineerFieldErrors = {}
  if (!error.details?.length) return out
  for (const d of error.details) {
    const path = d.path as keyof ElectricalEngineerFieldErrors
    if (path) out[path] = d.message
  }
  return out
}
