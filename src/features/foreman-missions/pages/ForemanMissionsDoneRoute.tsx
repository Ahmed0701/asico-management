import RequirePermission from "@/features/auth/components/RequirePermission"
import ForemanMissionsListPage from "./ForemanMissionsListPage"

/** The foreman missions someone checked as done. */
export default function ForemanMissionsDoneRoute() {
  return (
    <RequirePermission permission="foreman-missions:read">
      <ForemanMissionsListPage done />
    </RequirePermission>
  )
}
