import RequirePermission from "@/features/auth/components/RequirePermission"
import MaintenanceListPage from "./MaintenanceListPage"

/** The maintenance villas still open. */
export default function MaintenanceRoute() {
  return (
    <RequirePermission permission="maintenance:read">
      <MaintenanceListPage solved={false} />
    </RequirePermission>
  )
}
