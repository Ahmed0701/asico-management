import {
  utcLast7DaysRange,
  utcTodayOnlyRange,
  villaOverdueListSearch,
  villaUpcomingListSearch,
} from "./dashboardUtc"

export const dashboardLinks = {
  villas: () => "/villas",
  villaOverdue: () => `/villas?${villaOverdueListSearch()}`,
  villaUpcoming: () => `/villas?${villaUpcomingListSearch()}`,
  mewFollowUp: () => "/villas/mew-follow-up",
  mewInspection: () => "/villas/mew-inspection",
  maintenance: () => "/maintenance",
  openWorks: () => "/villas/open-works",
  openWorksStatus: (status: string) =>
    `/villas/open-works?status=${encodeURIComponent(status)}`,
  openWorksOverdue: () => "/villas/open-works?overdue=true",
  openWorksTotal: () => "/villas/open-works",
  openWorksDelayed: () => "/villas/open-works?status=DELAYED",
  smallWorksTotal: () => "/small-works",
  dailyReports: () => "/daily-reports",
  dailyReportsByContractor: (contractorId: string) =>
    `/daily-reports?contractorId=${encodeURIComponent(contractorId)}`,
  dailyReportsToday: () => {
    const { from, to } = utcTodayOnlyRange()
    return `/daily-reports?reportFrom=${from}&reportTo=${to}`
  },
  dailyReportsLast7: () => {
    const { from, to } = utcLast7DaysRange()
    return `/daily-reports?reportFrom=${from}&reportTo=${to}`
  },
  smallWorksPending: () => "/small-works?status=PENDING",
  smallWorksOverdue: () => "/small-works?overdue=true",
  smallWorksDueSoon: () => "/small-works?dueSoon=true",
  villaOpenWorks: (villaId: string) => `/villas/${villaId}?tab=openWorks`,
  villaSmallWorkHighlight: (villaId: string, workId: string) =>
    `/villas/${villaId}?tab=smallWorks&highlightSmallWork=${encodeURIComponent(workId)}`,
  siteReports: () => "/site-reports",
  labourToday: () => {
    const { from, to } = utcTodayOnlyRange()
    return `/site-reports?tab=labour&labourFrom=${from}&labourTo=${to}&labourPage=1`
  },
  labourLast7: () => {
    const { from, to } = utcLast7DaysRange()
    return `/site-reports?tab=labour&labourFrom=${from}&labourTo=${to}&labourPage=1`
  },
  labourAllTime: () => "/site-reports?tab=labour&labourPage=1",
}
