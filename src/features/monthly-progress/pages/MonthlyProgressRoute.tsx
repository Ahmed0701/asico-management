import RequirePermission from "@/features/auth/components/RequirePermission"
import MonthlyProgressPage from "./MonthlyProgressPage"

/** Each villa's progress last month and this month. */
export default function MonthlyProgressRoute() {
  return (
    <RequirePermission permission="villas:read">
      <MonthlyProgressPage />
    </RequirePermission>
  )
}
