import RequirePermission from "@/features/auth/components/RequirePermission"
import EngineersPage from "./EngineersPage"

export default function EngineersRoute() {
  return (
    <RequirePermission permission="civil-engineers:read">
      <EngineersPage />
    </RequirePermission>
  )
}
