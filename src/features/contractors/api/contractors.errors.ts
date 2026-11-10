import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onContractorsForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}

export type ContractorFieldErrors = Partial<Record<"name" | "phone" | "sort" | "limit" | "search" | "page" | "status", string>>

export function contractorFieldErrorsFromApi(
  error: ApiError,
): ContractorFieldErrors {
  const out: ContractorFieldErrors = {}
  if (!error.details?.length) return out
  for (const d of error.details) {
    const path = d.path as keyof ContractorFieldErrors
    if (path) out[path] = d.message
  }
  return out
}
