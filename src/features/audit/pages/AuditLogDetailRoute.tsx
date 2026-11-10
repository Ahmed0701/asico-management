import RequirePermission from "@/features/auth/components/RequirePermission"
import AuditLogDetailPage from "./AuditLogDetailPage"

export default function AuditLogDetailRoute() {
  return (
    <RequirePermission permission="audit:read">
      <AuditLogDetailPage />
    </RequirePermission>
  )
}
