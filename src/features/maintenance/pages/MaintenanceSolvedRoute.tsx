import RequirePermission from "@/features/auth/components/RequirePermission"
import MaintenanceListPage from "./MaintenanceListPage"

/** The maintenance villas someone checked as solved. */
export default function MaintenanceSolvedRoute() {
  return (
    <RequirePermission permission="maintenance:read">
      <MaintenanceListPage solved />
    </RequirePermission>
  )
}
