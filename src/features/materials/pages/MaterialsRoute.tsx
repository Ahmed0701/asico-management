import RequirePermission from "@/features/auth/components/RequirePermission"
import MaterialsPage from "./MaterialsPage"

export default function MaterialsRoute() {
  return (
    <RequirePermission permission="materials:read">
      <MaterialsPage />
    </RequirePermission>
  )
}
