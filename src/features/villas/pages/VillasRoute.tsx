import RequirePermission from "@/features/auth/components/RequirePermission"
import VillasPage from "./VillasPage"

export default function VillasRoute() {
  return (
    <RequirePermission permission="villas:read">
      <VillasPage />
    </RequirePermission>
  )
}
