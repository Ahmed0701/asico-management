import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onVillasForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}

export type VillaFieldErrors = Partial<Record<"villaNumber" | "ownerName" | "villaType" | "areaId" | "block" | "plot" | "civilEngineerId" | "electricalEngineerId" | "contractorId" | "startDate" | "targetDate" | "budgetMinor" | "currency" | "sort" | "limit" | "search" | "page", string>>

export function villaFieldErrorsFromApi(error: ApiError): VillaFieldErrors {
  const out: VillaFieldErrors = {}
  if (!error.details?.length) return out
  for (const d of error.details) {
    const path = d.path as keyof VillaFieldErrors
    if (path) out[path] = d.message
  }
  return out
}
