import RequirePermission from "@/features/auth/components/RequirePermission"
import AuditLogPage from "./AuditLogPage"

export default function AuditLogRoute() {
  return (
    <RequirePermission permission="audit:read">
      <AuditLogPage />
    </RequirePermission>
  )
}
