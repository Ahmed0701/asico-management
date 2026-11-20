import RequirePermission from "@/features/auth/components/RequirePermission"
import DepartmentOverheadPage from "./DepartmentOverheadPage"

/** The department's overhead employees and their salaries: behind their own permission. */
export default function DepartmentOverheadRoute() {
  return (
    <RequirePermission permission="overhead:read">
      <DepartmentOverheadPage />
    </RequirePermission>
  )
}
