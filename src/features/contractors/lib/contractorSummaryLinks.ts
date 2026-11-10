export function contractorSummaryLinks(contractorId: string) {
  const id = encodeURIComponent(contractorId)
  return {
    openWorks: `/villas/open-works?contractorId=${id}`,
    openWorksDelayed: `/villas/open-works?contractorId=${id}&status=DELAYED`,
    openWorksOverdue: `/villas/open-works?contractorId=${id}&overdue=true`,
    smallWorks: `/small-works?contractorId=${id}`,
    smallWorksPending: `/small-works?contractorId=${id}&status=PENDING`,
    smallWorksOverdue: `/small-works?contractorId=${id}&overdue=true`,
    smallWorksDueSoon: `/small-works?contractorId=${id}&dueSoon=true`,
    dailyReports: `/daily-reports?contractorId=${id}`,
    labour: `/site-reports?tab=labour&contractorId=${id}`,
  }
}
