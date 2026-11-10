import RequirePermission from "@/features/auth/components/RequirePermission"
import ElectricalEngineersPage from "./ElectricalEngineersPage"

export default function ElectricalEngineersRoute() {
  return (
    <RequirePermission permission="electrical-engineers:read">
      <ElectricalEngineersPage />
    </RequirePermission>
  )
}
