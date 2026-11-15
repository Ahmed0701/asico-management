import RequirePermission from "@/features/auth/components/RequirePermission"
import ForemanMissionsListPage from "./ForemanMissionsListPage"

/** The foreman missions still open (reminded every day). */
export default function ForemanMissionsRoute() {
  return (
    <RequirePermission permission="foreman-missions:read">
      <ForemanMissionsListPage done={false} />
    </RequirePermission>
  )
}
