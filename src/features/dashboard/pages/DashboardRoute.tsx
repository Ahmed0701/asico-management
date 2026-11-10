import RequirePermission from "@/features/auth/components/RequirePermission"
import DashboardPage from "./DashboardPage"

export default function DashboardRoute() {
  return (
    <RequirePermission
      permission="dashboard:read"
      forbiddenTitleKey="dashboard.forbiddenTitle"
      forbiddenBodyKey="dashboard.forbiddenBody"
    >
      <DashboardPage />
    </RequirePermission>
  )
}
