import type { PaginatedMeta } from "@/shared/api/types"

/** The villa of a note: its number and location ("<area> . <block> . <plot>"). */
export type ForemanMissionVilla = {
  id: string
  villaNumber: string
  location: string
}

/** A foreman's mission at a villa. Open notes are reminded every day through the notifications until checked as done. */
export type ForemanMission = {
  id: string
  villa: ForemanMissionVilla
  /** The villa's owner, as it is now (null: the villa has no owner name). */
  ownerName: string | null
  notes: string
  done: boolean
  /** When it was checked as done; null while it is open. */
  doneAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export type ForemanMissionsListParams = {
  page: number
  limit: number
  search?: string
  /** true: the done list; false: the open list. */
  done: boolean
}

export type ForemanMissionsListResponse = {
  data: ForemanMission[]
  meta: PaginatedMeta
}

/** The owner name is not sent: it is the villa's. */
export type ForemanMissionInput = {
  villaId: string
  notes: string
}

export type ForemanMissionUpdate = Partial<ForemanMissionInput> & {
  done?: boolean
}
