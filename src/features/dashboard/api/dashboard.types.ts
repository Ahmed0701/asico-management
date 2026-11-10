export type DashboardAreaRow = {
  areaId: string
  area: string
  city: string
  total: number
}

export type DashboardContractorRow = {
  id: string
  name: string
  total: number
}

export type DashboardProgress = {
  average: number
  notStarted: number
  inProgress: number
  done: number
}

export type DashboardOpenWorks = {
  total: number
  delayed: number
  byStatus: {
    NOT_STARTED: number
    IN_PROGRESS: number
    DELAYED: number
    DONE: number
  }
  overdue: number
  overdueList: OverdueOpenWork[]
}

/** An open work past its end date (APP_TIMEZONE) and not done. */
export type OverdueOpenWork = {
  id: string
  villa: {
    id: string
    villaNumber: string
  }
  elecPhase: {
    name: string
  }
  contractor: {
    name: string
  } | null
  endDate: string
  overdueDays: number
}

export type DashboardDailyFigures = {
  today: number
  last7Days: number
}

export type DashboardSiteReports = {
  count: number
  averageRating: number | null
}

export type UrgentSmallWorkAlert = "overdue" | "dueSoon"

export type UrgentSmallWork = {
  id: string
  villa: {
    id: string
    villaNumber: string
  }
  description: string
  contractor: {
    id: string
    name: string
  }
  endDate: string
  deadlineAt: string
  alert: UrgentSmallWorkAlert
}

export type DashboardSmallWorks = {
  total: number
  pending: number
  dueSoon: number
  overdue: number
  urgent: UrgentSmallWork[]
}

export type DashboardTotalLabour = {
  total: number
}

export type DashboardDelayedSmallWorks = {
  overdue: number
  dueSoon: number
}

/** Maintenance villas still open, and the ones checked as solved. */
export type DashboardMaintenance = {
  open: number
  solved: number
}

export type DashboardSummary = {
  villas: { total: number } | null
  progress: DashboardProgress | null
  overdue: { count: number } | null
  upcoming: { count: number } | null
  mewFollowUp: { count: number } | null
  mewInspection: { count: number } | null
  byArea: DashboardAreaRow[] | null
  topContractors: DashboardContractorRow[] | null
  openWorks: DashboardOpenWorks | null
  dailyReports: DashboardDailyFigures | null
  smallWorks: DashboardSmallWorks | null
  siteReports: DashboardSiteReports | null
  labour: DashboardDailyFigures | null
  totalLabour: DashboardTotalLabour | null
  delayedSmallWorks: DashboardDelayedSmallWorks | null
  maintenance: DashboardMaintenance | null
  generatedAt: string
}

export function dashboardHasAnySection(summary: DashboardSummary): boolean {
  return (
    summary.villas !== null ||
    summary.progress !== null ||
    summary.overdue !== null ||
    summary.upcoming !== null ||
    summary.mewFollowUp !== null ||
    summary.mewInspection !== null ||
    summary.maintenance !== null ||
    summary.byArea !== null ||
    summary.topContractors !== null ||
    summary.openWorks !== null ||
    summary.dailyReports !== null ||
    summary.smallWorks !== null ||
    // Site reports have no card on the dashboard any more, so they alone do not make a section.
    summary.labour !== null ||
    summary.totalLabour !== null ||
    summary.delayedSmallWorks !== null
  )
}
