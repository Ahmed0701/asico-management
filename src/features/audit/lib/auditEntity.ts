import type { PermissionCode } from "@/features/auth/api"

export type AuditEntityCode = "User" | "Project" | "Villa" | "Contractor" | "CivilEngineer" | "ProjectFile" | "AuditLog"

export type AuditEntityView = {
  /** Localized display label from the API. */
  entity: string
  entityCode: string
  entityName: string | null
  entityDetail: string | null
  entityId: string | null
}

type CanFn = (permission: PermissionCode) => boolean

export function formatAuditEntityLine(
  entity: string,
  entityName: string | null,
  entityDetail?: string | null,
): string {
  const name = entityName?.trim()
  const detail = entityDetail?.trim()
  if (name && detail) return `${entity} · ${name} (${detail})`
  if (name) return `${entity} · ${name}`
  return entity
}

export function auditEntityHref(
  entityCode: string,
  entityId: string | null,
  can: CanFn,
): string | null {
  if (!entityId) return null
  switch (entityCode as AuditEntityCode) {
    case "User":
      return can("users:read") ? `/users/${entityId}` : null
    case "Project":
      return can("villas:detail") ? `/villas/${entityId}` : null
    case "Villa":
      return can("villas:detail") ? `/villas/${entityId}` : null
    case "Contractor":
      return can("contractors:read") ? `/contractors/${entityId}` : null
    case "CivilEngineer":
      return can("civil-engineers:read") ? `/civil-engineers/${entityId}` : null
    case "AuditLog":
      return can("audit:read") ? `/audit/${entityId}` : null
    case "ProjectFile":
      return null
    default:
      return null
  }
}
