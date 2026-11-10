import type { Query, QueryClient } from "@tanstack/react-query"
import { invalidateContractorSummariesAndLists } from "@/features/contractors/lib/contractorSummaryQueryCache"
import { invalidateOpenWorksAfterWrite } from "@/features/open-works/lib/openWorksQueryCache"
import { dashboardKeys } from "@/features/dashboard/api/dashboard.queries"
import { villasKeys } from "../api/villas.queries"
import type { VillaDetail } from "../api/villas.types"
import {
  mergeListItemIntoDetail,
  mergePhaseUpdateIntoDetail,
} from "./villaDetailCache"
import type { PhaseProgressUpdateDto, VillaListItem } from "../api/villas.types"

export function isVillaListQuery(query: Query): boolean {
  const key = query.queryKey
  return key[0] === villasKeys.all[0] && key[1] === "list"
}

/** Refetch villa lists and dashboard; do not invalidate villa detail. */
export function invalidateVillaListsAndDashboard(qc: QueryClient): void {
  void qc.invalidateQueries({ predicate: isVillaListQuery })
  void qc.invalidateQueries({ queryKey: dashboardKeys.summary() })
  invalidateContractorSummariesAndLists(qc)
}

/** Phase progress creates or updates automatic open works; refresh summaries. */
export function invalidateAfterVillaPhaseProgress(
  qc: QueryClient,
  villaId: string,
): void {
  invalidateVillaListsAndDashboard(qc)
  invalidateOpenWorksAfterWrite(qc, villaId)
}

export function patchVillaDetailFromPhaseUpdate(
  qc: QueryClient,
  villaId: string,
  update: PhaseProgressUpdateDto,
): void {
  const detail = qc.getQueryData<VillaDetail>(villasKeys.detail(villaId))
  if (!detail) return
  qc.setQueryData(
    villasKeys.detail(villaId),
    mergePhaseUpdateIntoDetail(detail, update),
  )
}

export function patchVillaDetailFromListItem(
  qc: QueryClient,
  item: VillaListItem,
): void {
  const detail = qc.getQueryData<VillaDetail>(villasKeys.detail(item.id))
  if (!detail) return
  qc.setQueryData(
    villasKeys.detail(item.id),
    mergeListItemIntoDetail(detail, item),
  )
}

export function setVillaDetailCache(
  qc: QueryClient,
  detail: VillaDetail,
): void {
  qc.setQueryData(villasKeys.detail(detail.id), detail)
}

export function removeVillaDetailCache(qc: QueryClient, id: string): void {
  qc.removeQueries({ queryKey: villasKeys.detail(id) })
}
