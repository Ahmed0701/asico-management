import RequirePermission from "@/features/auth/components/RequirePermission"
import StorePage from "./StorePage"

/** The store's stock and movements. */
export default function StoreRoute() {
  return (
    <RequirePermission permission="store:read">
      <StorePage />
    </RequirePermission>
  )
}
