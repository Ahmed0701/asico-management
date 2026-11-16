import type { PaginatedMeta } from "@/shared/api/types"

/** The villa of a note: its number and location ("<area> . <block> . <plot>"). */
export type OwnerNoteVilla = {
  id: string
  villaNumber: string
  location: string
}

/** An owner's note about a villa. Open notes are reminded every day through the notifications until checked as done. */
export type OwnerNote = {
  id: string
  villa: OwnerNoteVilla
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

export type OwnerNotesListParams = {
  page: number
  limit: number
  search?: string
  /** "villaNumber", "villaNumber:asc" or "villaNumber:desc"; the list's own order when absent. */
  sort?: string
  /** true: the done list; false: the open list. */
  done: boolean
}

export type OwnerNotesListResponse = {
  data: OwnerNote[]
  meta: PaginatedMeta
}

/** The owner name is not sent: it is the villa's. */
export type OwnerNoteInput = {
  villaId: string
  notes: string
}

export type OwnerNoteUpdate = Partial<OwnerNoteInput> & {
  done?: boolean
}
