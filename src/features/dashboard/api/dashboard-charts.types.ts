/** One month of the villas' overall progress: at its end (now for the current month). */
export type ProgressTrendPoint = {
  month: string
  average: number
  done: number
  villas: number
}

/** One active electrical phase and its open works by status. */
export type PhaseStatusRow = {
  elecPhaseId: string
  name: string
  notStarted: number
  inProgress: number
  delayed: number
  done: number
}

/** One UTC day and the workers on site that day, all villas together. */
export type LabourDay = {
  day: string
  workers: number
}

/** One month and what was paid to contractors in it, KWD fils. */
export type PaymentMonth = {
  month: string
  paidMinor: number
}

/** Each chart is null when the viewer may not see it. */
export type DashboardCharts = {
  progressTrend: ProgressTrendPoint[] | null
  phaseStatus: PhaseStatusRow[] | null
  labourByDay: LabourDay[] | null
  paymentsByMonth: PaymentMonth[] | null
  generatedAt: string
}
