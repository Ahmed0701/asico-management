import RequirePermission from "@/features/auth/components/RequirePermission"
import MewInspectionPassedPage from "./MewInspectionPassedPage"

export default function MewInspectionPassedRoute() {
  return (
    <RequirePermission permission="villas:read">
      <MewInspectionPassedPage />
    </RequirePermission>
  )
}
