import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useSearchParams } from "react-router"
import { parseListParams, setListParam } from "@/shared/query/listParams"
import { toApiError } from "@/shared/api/errors"
import {
  removeFromPaginatedCaches,
  upsertInPaginatedCaches,
  type WriteRequest,
} from "@/shared/api/write-safety"
import type {
  CreateUserInput,
  UpdateUserInput,
  UserListItem,
  UsersListParams,
} from "./users.types"
import * as api from "./users.api"
import { onUsersForbidden } from "./users.errors"

export const usersKeys = {
  all: ["users"] as const,
  list: (params: UsersListParams) =>
    [...usersKeys.all, "list", params] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
}

export function usersListParamsFromSearch(
  searchParams: URLSearchParams,
): UsersListParams {
  const base = parseListParams(searchParams)
  const role = searchParams.get("role")
  const isActiveRaw = searchParams.get("isActive")
  let isActive: boolean | undefined
  if (isActiveRaw === "true") isActive = true
  if (isActiveRaw === "false") isActive = false
  return {
    page: base.page,
    limit: base.limit,
    sort: base.sort,
    search: base.search,
    role: role === "ADMIN" || role === "EMPLOYEE" ? role : undefined,
    isActive,
  }
}

export function useUsersListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(
    () => usersListParamsFromSearch(searchParams),
    [searchParams],
  )
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(setListParam(searchParams, key, value))
  const setPage = (page: number) =>
    setSearchParams(setListParam(searchParams, "page", page))
  const setLimit = (limit: number) =>
    setSearchParams(setListParam(searchParams, "limit", limit))
  const toggleSort = (field: string) => {
    const current = params.sort ?? ""
    const [curField, curDir] = current.split(":")
    const nextDir = curField === field && curDir !== "desc" ? "desc" : "asc"
    setParam("sort", `${field}:${nextDir}`)
  }
  return {
    params,
    setParam,
    setPage,
    setLimit,
    toggleSort,
    searchParams,
    setSearchParams,
  }
}

export function useUsersListQuery() {
  const { params } = useUsersListParams()
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => api.listUsers(params),
  })
}

export function useUserQuery(id: string | undefined) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? ""),
    queryFn: () => api.getUser(id!),
    enabled: !!id,
  })
}

function patchUserCaches(
  qc: ReturnType<typeof useQueryClient>,
  item: UserListItem,
) {
  upsertInPaginatedCaches(qc, usersKeys.all, item)
  qc.setQueryData(usersKeys.detail(item.id), (old: unknown) =>
    old && typeof old === "object" ? { ...old as object, ...item } : old,
  )
}

function removeUserCaches(qc: ReturnType<typeof useQueryClient>, id: string) {
  removeFromPaginatedCaches(qc, usersKeys.all, id)
  qc.removeQueries({ queryKey: usersKeys.detail(id) })
}

function useUsersMutationDefaults() {
  const qc = useQueryClient()
  return {
    onError: (err: unknown) => onUsersForbidden(qc, toApiError(err)),
    qc,
  }
}

export function useCreateUserMutation() {
  const { onError, qc } = useUsersMutationDefaults()
  return useMutation({
    mutationFn: ({
      input,
      write,
    }: {
      input: CreateUserInput
      write: WriteRequest
    }) => api.createUser(input, write),
    onError,
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.all }),
  })
}

export function useUpdateUserMutation() {
  const { onError, qc } = useUsersMutationDefaults()
  return useMutation({
    mutationFn: ({
      id,
      input,
      write,
    }: {
      id: string
      input: UpdateUserInput
      write: WriteRequest
    }) => api.updateUser(id, input, write),
    onError,
    onSuccess: (item) => patchUserCaches(qc, item),
  })
}

export function useActivateUserMutation() {
  const { onError, qc } = useUsersMutationDefaults()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Pick<WriteRequest, "ifMatch">
    }) => api.activateUser(id, write),
    onError,
    onSuccess: (item) => patchUserCaches(qc, item),
  })
}

export function useDeactivateUserMutation() {
  const { onError, qc } = useUsersMutationDefaults()
  return useMutation({
    mutationFn: ({
      id,
      write,
    }: {
      id: string
      write: Pick<WriteRequest, "ifMatch">
    }) => api.deactivateUser(id, write),
    onError,
    onSuccess: (item) => patchUserCaches(qc, item),
  })
}

type DeleteUserArgs = {
  id: string
  version: number
}

export function useDeleteUserMutation() {
  const { qc } = useUsersMutationDefaults()
  return useMutation({
    mutationFn: ({ id, version }: DeleteUserArgs) =>
      api.deleteUser(id, version),
    onSuccess: () => void qc.invalidateQueries({ queryKey: usersKeys.all }),
  })
}

type ResetUserPasswordMutationArgs = {
  id: string
  write: WriteRequest
}

export function useResetUserPasswordMutation() {
  const { onError, qc } = useUsersMutationDefaults()
  return useMutation({
    mutationFn: ({ id, write }: ResetUserPasswordMutationArgs) =>
      api.resetUserPassword(id, write),
    onError,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: usersKeys.all })
      void qc.invalidateQueries({ queryKey: usersKeys.detail(id) })
    },
  })
}

export { removeUserCaches }
