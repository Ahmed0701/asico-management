import { Link } from "react-router"
import { usePermissions } from "@/features/auth/api"
import { auditEntityHref, type AuditEntityView } from "../lib/auditEntity"
import TruncatedText from "./TruncatedText"

export default function AuditEntityCell({
  entity,
  entityCode,
  entityName,
  entityDetail,
  entityId,
}: AuditEntityView) {
  const { can } = usePermissions()
  const href = auditEntityHref(entityCode, entityId, can)
  const name = entityName?.trim()
  const detail = entityDetail?.trim()

  return (
    <span className="text-sm">
      <span>{entity}</span>
      {name && (
        <>
          {" · "}
          {href ? (
            <Link
              to={href}
              dir="ltr"
              className="font-medium text-accent hover:underline"
            >
              {name}
            </Link>
          ) : (
            <TruncatedText
              text={name}
              maxWidthClass="max-w-[12rem]"
              className="font-medium text-muted-foreground"
            />
          )}
        </>
      )}
      {detail && (
        <span dir="ltr" className="mt-0.5 block text-xs text-muted-foreground">
          {detail}
        </span>
      )}
    </span>
  )
}
