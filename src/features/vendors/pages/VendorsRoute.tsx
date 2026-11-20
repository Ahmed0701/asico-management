import RequirePermission from "@/features/auth/components/RequirePermission"
import VendorsPage from "./VendorsPage"

/** Each villa's factories, the material balance and the materials set up: read with materials:read. */
export default function VendorsRoute() {
  return (
    <RequirePermission permission="materials:read">
      <VendorsPage />
    </RequirePermission>
  )
}
