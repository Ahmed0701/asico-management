import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import type {
  DashboardAreaRow,
  DashboardContractorRow,
  DashboardDailyFigures,
  DashboardMaintenance,
  DashboardOpenWorks,
  DashboardProgress,
  DashboardSiteReports,
  DashboardDelayedSmallWorks,
  DashboardSmallWorks,
  DashboardSummary,
  DashboardTotalLabour,
} from "./dashboard.types"

/** Raw `/dashboard/summary` payload. */
export type DashboardSummaryApi = {
  villas?: { total: number } | null
  progress?: DashboardProgress | null
  overdue?: { count: number } | null
  upcoming?: { count: number } | null
  mewFollowUp?: { count: number } | null
  mewInspection?: { count: number } | null
  maintenance?: DashboardMaintenance | null
  byArea?: DashboardAreaRow[] | null
  topContractors?: DashboardContractorRow[] | null
  openWorks?: DashboardOpenWorks | null
  dailyReports?: DashboardDailyFigures | null
  smallWorks?: DashboardSmallWorks | null
  siteReports?: DashboardSiteReports | null
  labour?: DashboardDailyFigures | null
  totalLabour?: DashboardTotalLabour | null
  delayedSmallWorks?: DashboardDelayedSmallWorks | null
  generatedAt?: string
}

function normalizeProgress(
  raw: NonNullable<DashboardSummaryApi["progress"]>,
): DashboardProgress {
  return {
    average: raw.average ?? 0,
    notStarted: raw.notStarted ?? 0,
    inProgress: raw.inProgress ?? 0,
    done: raw.done ?? 0,
  }
}

function normalizeOpenWorks(
  raw: NonNullable<DashboardSummaryApi["openWorks"]>,
): DashboardOpenWorks {
  const by = raw.byStatus ?? {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    DELAYED: 0,
    DONE: 0,
  }
  return {
    total: raw.total ?? 0,
    delayed: raw.delayed ?? 0,
    byStatus: {
      NOT_STARTED: by.NOT_STARTED ?? 0,
      IN_PROGRESS: by.IN_PROGRESS ?? 0,
      DELAYED: by.DELAYED ?? 0,
      DONE: by.DONE ?? 0,
    },
    overdue: raw.overdue ?? 0,
    overdueList: raw.overdueList ?? [],
  }
}

function normalizeDailyFigures(
  raw: NonNullable<DashboardSummaryApi["dailyReports"]>,
): DashboardDailyFigures {
  return {
    today: raw.today ?? 0,
    last7Days: raw.last7Days ?? 0,
  }
}

function normalizeSmallWorks(
  raw: NonNullable<DashboardSummaryApi["smallWorks"]>,
): DashboardSmallWorks {
  return {
    total: raw.total ?? 0,
    pending: raw.pending ?? 0,
    dueSoon: raw.dueSoon ?? 0,
    overdue: raw.overdue ?? 0,
    urgent: raw.urgent ?? [],
  }
}

function normalizeTotalLabour(
  raw: NonNullable<DashboardSummaryApi["totalLabour"]>,
): DashboardTotalLabour {
  return { total: raw.total ?? 0 }
}

function normalizeDelayedSmallWorks(
  raw: NonNullable<DashboardSummaryApi["delayedSmallWorks"]>,
): DashboardDelayedSmallWorks {
  return {
    overdue: raw.overdue ?? 0,
    dueSoon: raw.dueSoon ?? 0,
  }
}

export function mapDashboardSummary(
  raw: DashboardSummaryApi,
): DashboardSummary {
  return {
    villas: raw.villas ?? null,
    progress: raw.progress ? normalizeProgress(raw.progress) : null,
    overdue: raw.overdue ?? null,
    upcoming: raw.upcoming ?? null,
    mewFollowUp: raw.mewFollowUp ?? null,
    mewInspection: raw.mewInspection ?? null,
    byArea: raw.byArea ?? null,
    topContractors: raw.topContractors ?? null,
    openWorks: raw.openWorks ? normalizeOpenWorks(raw.openWorks) : null,
    dailyReports: raw.dailyReports
      ? normalizeDailyFigures(raw.dailyReports)
      : null,
    smallWorks: raw.smallWorks ? normalizeSmallWorks(raw.smallWorks) : null,
    siteReports: raw.siteReports ?? null,
    labour: raw.labour ? normalizeDailyFigures(raw.labour) : null,
    totalLabour: raw.totalLabour ? normalizeTotalLabour(raw.totalLabour) : null,
    delayedSmallWorks: raw.delayedSmallWorks
      ? normalizeDelayedSmallWorks(raw.delayedSmallWorks)
      : null,
    maintenance: raw.maintenance ?? null,
    generatedAt: raw.generatedAt ?? new Date(0).toISOString(),
  }
}

export async function getDashboardSummary(
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  const raw = await unwrap(
    api.get<ApiSuccess<DashboardSummaryApi>>("/dashboard/summary", { signal }),
  )
  return mapDashboardSummary(raw)
}
