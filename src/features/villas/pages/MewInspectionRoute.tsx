import RequirePermission from "@/features/auth/components/RequirePermission"
import MewInspectionPage from "./MewInspectionPage"

export default function MewInspectionRoute() {
  return (
    <RequirePermission permission="villas:read">
      <MewInspectionPage />
    </RequirePermission>
  )
}
