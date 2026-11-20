import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"

/** A villa's MEW inspection report (one PDF). */
export type MewReport = {
  villaId: string
  name: string
  size: number
  uploadedBy: { id: string; name: string } | null
  uploadedAt: string
}

export const MEW_REPORT_ACCEPT = "application/pdf"

export const mewReportKeys = {
  all: ["mew-reports"] as const,
  ofVillas: (villaIds: string[]) =>
    [...mewReportKeys.all, [...villaIds].sort().join(",")] as const,
}

/** The reports of these villas (the villas of one page). */
export async function listMewReports(villaIds: string[]): Promise<MewReport[]> {
  return unwrap(
    api.get<ApiSuccess<MewReport[]>>("/mew-inspection-reports", {
      params: { villaIds: villaIds.join(",") },
    }),
  )
}

export async function uploadMewReport(
  villaId: string,
  file: File,
): Promise<MewReport> {
  const form = new FormData()
  form.append("file", file)
  return unwrap(
    api.post<ApiSuccess<MewReport>>(
      `/villas/${villaId}/mew-inspection-report`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    ),
  )
}

export async function deleteMewReport(villaId: string): Promise<void> {
  await api.delete(`/villas/${villaId}/mew-inspection-report`)
}

/**
 * Shows the report in a new tab. The tab is opened at once, inside the click, so a popup blocker allows it; the file is
 * fetched with the user's session and shown in it, and the tab is closed again if it cannot be read.
 */
export async function viewMewReport(villaId: string): Promise<void> {
  const tab = window.open("about:blank", "_blank")
  try {
    const res = await api.get<Blob>(
      `/villas/${villaId}/mew-inspection-report/file`,
      { responseType: "blob" },
    )
    const url = URL.createObjectURL(res.data)
    if (tab) tab.location.href = url
    else window.location.assign(url)
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    tab?.close()
    throw err
  }
}

export function useMewReportsQuery(villaIds: string[]) {
  return useQuery({
    queryKey: mewReportKeys.ofVillas(villaIds),
    queryFn: () => listMewReports(villaIds),
    enabled: villaIds.length > 0,
    retry: 1,
  })
}

export function useUploadMewReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { villaId: string; file: File }) =>
      uploadMewReport(args.villaId, args.file),
    onSuccess: () => qc.invalidateQueries({ queryKey: mewReportKeys.all }),
  })
}

export function useDeleteMewReportMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (villaId: string) => deleteMewReport(villaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: mewReportKeys.all }),
  })
}
