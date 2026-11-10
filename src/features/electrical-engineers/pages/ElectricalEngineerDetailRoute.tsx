import RequirePermission from "@/features/auth/components/RequirePermission"
import ElectricalEngineerDetailPage from "./ElectricalEngineerDetailPage"

export default function ElectricalEngineerDetailRoute() {
  return (
    <RequirePermission permission="electrical-engineers:read">
      <ElectricalEngineerDetailPage />
    </RequirePermission>
  )
}
