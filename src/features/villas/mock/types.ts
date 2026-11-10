export type VillaAreaRef = {
  id: string
  name: string
  city: string
}

export type VillaPhase = {
  elecPhaseId: string
  name: string
  order: number
  progress: number
  state: "done" | "in_progress" | "not_started"
}

export type VillaRecord = {
  villaNumber: string
  ownerName: string
  area: VillaAreaRef
  block: string
  plot: string
  location: string
  contractorId: string
  contractor: string
  contractorEmail?: string
  electricalEngineerId: string
  electricalEngineer: string
  electricalEngineerEmail?: string
  civilEngineerId: string
  civilEngineer: string
  civilEngineerEmail?: string
  startDate: string
  targetDate: string
  budgetMinor: number
  currency: string
  progress: number
  phases: VillaPhase[]
  status: "planning" | "in_progress" | "closed"
  worksDone: number
  worksTotal: number
  worksDelayed: number
}
