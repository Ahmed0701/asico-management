import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useCallback } from "react"
import { clearAccessToken, getAccessToken } from "@/shared/auth/accessToken"
import { broadcastAuthLogout } from "@/shared/auth/authRefreshBroadcast"
import { isTransientMeFailure } from "@/shared/auth/authRefreshErrors"
import { backoffDelay } from "@/shared/auth/retryDelay"
import { toApiError } from "@/shared/api/client"
import * as authApi from "./auth.api"
import { canAccess, type PermissionCode } from "./permissions"
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  MeDto,
  ResetPasswordInput,
  SignupInput,
  UpdateMeInput,
} from "./auth.types"

export const meQueryKey = ["me"] as const

const ME_FETCH_MAX_ATTEMPTS = 3

async function fetchMeWithRetry(): Promise<MeDto> {
  let lastError: unknown
  for (let attempt = 0; attempt < ME_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      return await authApi.getMe()
    } catch (error) {
      lastError = error
      const apiErr = toApiError(error)
      if (
        isTransientMeFailure(apiErr.status) &&
        attempt < ME_FETCH_MAX_ATTEMPTS - 1
      ) {
        await backoffDelay(attempt)
        continue
      }
      throw error
    }
  }
  throw lastError
}

let bootstrapPromise: Promise<boolean> | null = null

async function runBootstrapSession(queryClient: QueryClient): Promise<boolean> {
  try {
    await authApi.refreshSession()
    const me = await fetchMeWithRetry()
    queryClient.setQueryData(meQueryKey, me)
    return true
  } catch {
    clearAccessToken()
    void import("@/shared/auth/proactiveAccessRefresh").then((m) =>
      m.stopProactiveAccessRefresh(),
    )
    queryClient.setQueryData<MeDto | undefined>(meQueryKey, undefined)
    queryClient.removeQueries({ queryKey: meQueryKey })
    return false
  }
}

export async function bootstrapSession(
  queryClient: QueryClient,
): Promise<boolean> {
  if (!bootstrapPromise) {
    bootstrapPromise = runBootstrapSession(queryClient).finally(() => {
      bootstrapPromise = null
    })
  }
  return bootstrapPromise
}

/** Test-only reset of bootstrap single-flight. */
export function resetBootstrapSessionForTests(): void {
  bootstrapPromise = null
}

export function useMeQuery() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.getMe,
    enabled: !!getAccessToken(),
  })
}

export function usePermissions() {
  const { data: me } = useMeQuery()
  const can = useCallback((code: PermissionCode) => canAccess(me, code), [me])
  return { can, me, isAdmin: me?.role === "ADMIN" }
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async () => {
      await queryClient.fetchQuery({
        queryKey: meQueryKey,
        queryFn: authApi.getMe,
      })
    },
  })
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (input: SignupInput) => authApi.signup(input),
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  })
}

export function useUpdateMeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateMeInput) => authApi.updateMe(input),
    onSuccess: (me) => {
      queryClient.setQueryData<MeDto | undefined>(meQueryKey, (prev) => {
        if (me.permissions?.length) return me
        if (!prev) return me
        return { ...prev, ...me, permissions: prev.permissions }
      })
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } finally {
        clearAccessToken()
        broadcastAuthLogout()
        void import("@/shared/auth/proactiveAccessRefresh").then((m) =>
          m.stopProactiveAccessRefresh(),
        )
        queryClient.setQueryData(meQueryKey, undefined)
        queryClient.removeQueries({ queryKey: meQueryKey })
      }
    },
  })
}

export function getApiError(error: unknown) {
  return toApiError(error)
}
