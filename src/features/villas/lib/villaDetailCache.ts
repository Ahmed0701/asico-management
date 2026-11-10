import type {
  PhaseProgressUpdateDto,
  VillaDetail,
  VillaListItem,
} from "../api/villas.types"

/** Merge list-item fields returned by inspection mark/unmark into cached detail. */
export function mergeListItemIntoDetail(
  detail: VillaDetail,
  item: VillaListItem,
): VillaDetail {
  return {
    ...detail,
    villaNumber: item.villaNumber,
    ownerName: item.ownerName,
    villaType: item.villaType,
    area: item.area,
    areaId: item.areaId,
    block: item.block,
    plot: item.plot,
    location: item.location,
    startDate: item.startDate,
    targetDate: item.targetDate,
    budgetMinor: item.budgetMinor,
    currency: item.currency,
    progress: item.progress,
    mewFollowUp: item.mewFollowUp,
    mewInspection: item.mewInspection,
    mewInspectionPassed: item.mewInspectionPassed,
    mewAcState: item.mewAcState,
    mewElecState: item.mewElecState,
    mewInspectionDate: item.mewInspectionDate,
    version: item.version,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export function mergePhaseUpdateIntoDetail(
  detail: VillaDetail,
  update: PhaseProgressUpdateDto,
): VillaDetail {
  return {
    ...detail,
    progress: update.villaProgress,
    phaseCount: update.phaseCount,
    phases: detail.phases.map((phase) =>
      phase.elecPhaseId === update.elecPhaseId
        ? {
            elecPhaseId: update.elecPhaseId,
            name: update.name,
            order: update.order,
            progress: update.progress,
            state: update.state,
            version: update.version,
          }
        : phase,
    ),
  }
}
