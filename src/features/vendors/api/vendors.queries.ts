import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { materialsKeys } from "@/features/materials/api"
import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import { buildWriteHeaders, executeWrite } from "@/shared/api/write-safety"
import type {
  AssignedFactory,
  AvailableVendorVilla,
  VillaVendors,
  VillaVendorsInput,
  VillaVendorsParams,
  VillaVendorsResponse,
} from "./vendors.types"

// Under the materials keys: a factory renamed or deleted reads the vendors again.
export const vendorsKeys = {
  all: [...materialsKeys.all, "vendors"] as const,
  list: (params: VillaVendorsParams) =>
    [...materialsKeys.all, "vendors", params] as const,
}

export async function listVillaVendors(
  params: VillaVendorsParams,
  signal?: AbortSignal,
): Promise<VillaVendorsResponse> {
  const query: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  }
  if (params.search) query.search = params.search
  if (params.factoryId) query.factoryId = params.factoryId
  if (params.missing) query.missing = params.missing
  if (params.sort) query.sort = params.sort
  const res = await api.get<VillaVendorsResponse>("/material-vendors", {
    params: query,
    signal,
  })
  return { data: res.data.data, meta: res.data.meta, summary: res.data.summary }
}

export async function assignVillaVendors(
  villaId: string,
  input: VillaVendorsInput,
  version: number,
): Promise<VillaVendors> {
  const write = { ifMatch: version }
  return executeWrite(write, () =>
    unwrap(
      api.put<ApiSuccess<VillaVendors>>(`/villas/${villaId}/vendors`, input, {
        headers: buildWriteHeaders(write),
      }),
    ),
  )
}

export async function listAvailableVendorVillas(): Promise<AvailableVendorVilla[]> {
  return unwrap(
    api.get<ApiSuccess<AvailableVendorVilla[]>>("/material-vendors/available"),
  )
}

export async function addVendorVilla(villaId: string): Promise<VillaVendors> {
  return unwrap(
    api.post<ApiSuccess<VillaVendors>>(`/villas/${villaId}/vendors`),
  )
}

export async function removeVendorVilla(
  villaId: string,
  version: number,
): Promise<void> {
  const write = { ifMatch: version }
  await executeWrite(write, () =>
    api.delete(`/villas/${villaId}/vendors`, {
      headers: buildWriteHeaders(write),
    }),
  )
}

export async function getVillaVendors(villaId: string): Promise<VillaVendors> {
  return unwrap(api.get<ApiSuccess<VillaVendors>>(`/villas/${villaId}/vendors`))
}

/** One villa's assigned factories (the villa page, the delivery note form); waits while there is no villa. */
export function useVillaVendorsOfQuery(villaId: string | undefined) {
  return useQuery({
    queryKey: [...vendorsKeys.all, "villa", villaId] as const,
    queryFn: () => getVillaVendors(villaId!),
    enabled: !!villaId,
    retry: 1,
  })
}

/** The factory assigned to a villa for one type, or null. */
export function assignedFactoryOf(
  vendors: VillaVendors | undefined,
  type: "SWITCHGEAR" | "CABLE",
): AssignedFactory | null {
  if (!vendors) return null
  return type === "SWITCHGEAR" ? vendors.switchgear : vendors.cable
}

/** The villas that can be added to the list. */
export function useAvailableVendorVillasQuery() {
  return useQuery({
    queryKey: [...vendorsKeys.all, "available"] as const,
    queryFn: listAvailableVendorVillas,
    retry: 1,
  })
}

export function useAddVendorVillaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (villaId: string) => addVendorVilla(villaId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.all })
      void qc.invalidateQueries({ queryKey: ["villas"] })
    },
  })
}

type RemoveArgs = {
  villaId: string
  version: number
}

export function useRemoveVendorVillaMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ villaId, version }: RemoveArgs) =>
      removeVendorVilla(villaId, version),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.all })
      void qc.invalidateQueries({ queryKey: ["villas"] })
    },
  })
}

export function useVillaVendorsQuery(params: VillaVendorsParams) {
  return useQuery({
    queryKey: vendorsKeys.list(params),
    queryFn: ({ signal }) => listVillaVendors(params, signal),
    placeholderData: keepPreviousData,
    retry: 1,
  })
}

type AssignArgs = {
  villaId: string
  input: VillaVendorsInput
  version: number
}

/** The villa's version moves on: its page and the villa lists read it again. */
export function useAssignVillaVendorsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ villaId, input, version }: AssignArgs) =>
      assignVillaVendors(villaId, input, version),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.all })
      void qc.invalidateQueries({ queryKey: ["villas"] })
    },
  })
}
