import RequirePermission from "@/features/auth/components/RequirePermission"
import VillaDetailPage from "./VillaDetailPage"

export default function VillaDetailRoute() {
  return (
    <RequirePermission permission="villas:detail">
      <VillaDetailPage />
    </RequirePermission>
  )
}
