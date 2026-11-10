import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onAuditForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}

export type AuditFieldErrors = Partial<Record<"from" | "to" | "sort" | "limit" | "actorId" | "search" | "action" | "entity" | "entityId" | "page", string>>

export function auditFieldErrorsFromApi(error: ApiError): AuditFieldErrors {
  const out: AuditFieldErrors = {}
  if (!error.details?.length) return out
  for (const d of error.details) {
    const path = d.path as keyof AuditFieldErrors
    if (path) out[path] = d.message
  }
  return out
}
