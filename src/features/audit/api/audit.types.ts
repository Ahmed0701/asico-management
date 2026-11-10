import type { PaginatedMeta } from "@/shared/api/types"

export type AuditActor = {
  id: string
  name: string
  email: string
}

export type AuditLogListItem = {
  id: string
  actor: AuditActor | null
  action: string
  /** Localized action label (Accept-Language); the code when unknown. */
  actionLabel: string
  /** Localized display label (Accept-Language). */
  entity: string
  /** Raw entity code for logic, filters, and export. */
  entityCode: string
  entityName: string | null
  /** Second line (e.g. user email); null for other entities. */
  entityDetail: string | null
  entityId: string | null
  ip: string | null
  userAgent: string | null
  requestId: string | null
  createdAt: string
}

export type AuditLogDetail = AuditLogListItem & {
  before: unknown
  after: unknown
}

export type AuditFiltersData = {
  actions: string[]
  actionLabels: Record<string, string>
  entities: string[]
  entityLabels: Record<string, string>
  actors: {
    id: string
    name: string
  }[]
}

export type AuditListParams = {
  page: number
  limit: number
  sort?: "createdAt:asc" | "createdAt:desc"
  actorId?: string
  action?: string
  entity?: string
  entityId?: string
  from?: string
  to?: string
  search?: string
}

export type AuditListResponse = {
  data: AuditLogListItem[]
  meta: PaginatedMeta
}
