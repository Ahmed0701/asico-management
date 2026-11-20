import RequirePermission from "@/features/auth/components/RequirePermission"
import ProjectBudgetsPage from "./ProjectBudgetsPage"

/** Every villa's budget figures. */
export default function ProjectBudgetsRoute() {
  return (
    <RequirePermission permission="villas:read">
      <ProjectBudgetsPage />
    </RequirePermission>
  )
}
