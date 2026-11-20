import RequirePermission from "@/features/auth/components/RequirePermission"
import MaterialItemsPage from "./MaterialItemsPage"

/** The materials list: read with materials:read. */
export default function MaterialItemsRoute() {
  return (
    <RequirePermission permission="materials:read">
      <MaterialItemsPage />
    </RequirePermission>
  )
}
