import type { QueryClient } from "@tanstack/react-query"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import type { ApiError } from "@/shared/api/types"

export function onUsersForbidden(
  queryClient: QueryClient,
  error: ApiError,
): void {
  if (error.status === 403) {
    void queryClient.invalidateQueries({ queryKey: meQueryKey })
  }
}
