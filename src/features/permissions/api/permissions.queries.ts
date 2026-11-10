import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toApiError } from "@/shared/api/errors"
import { meQueryKey } from "@/features/auth/api/auth.queries"
import { usersKeys } from "@/features/users/api/users.queries"
import * as api from "./permissions.api"
import { onUsersForbidden } from "@/features/users/api/users.errors"

export const permissionsKeys = {
  all: ["permissions"] as const,
  catalog: () => [...permissionsKeys.all, "catalog"] as const,
  user: (userId: string) => [...permissionsKeys.all, "user", userId] as const,
}

export function usePermissionCatalogQuery() {
  return useQuery({
    queryKey: permissionsKeys.catalog(),
    queryFn: api.listPermissionGroups,
  })
}

export function useUserPermissionsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: permissionsKeys.user(userId ?? ""),
    queryFn: () => api.getUserPermissions(userId!),
    enabled: !!userId,
  })
}

export function useReplaceUserPermissionsMutation(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (permissions: string[]) =>
      api.replaceUserPermissions(userId, permissions),
    onError: (err: unknown) => onUsersForbidden(qc, toApiError(err)),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: permissionsKeys.user(userId) })
      void qc.invalidateQueries({ queryKey: usersKeys.detail(userId) })
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      const me = qc.getQueryData<{ id: string }>(meQueryKey)
      if (me?.id === result.userId) {
        void qc.invalidateQueries({ queryKey: meQueryKey })
      }
    },
  })
}
