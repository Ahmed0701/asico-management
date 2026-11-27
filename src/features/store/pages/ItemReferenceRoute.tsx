import RequirePermission from "@/features/auth/components/RequirePermission"
import ItemReferencePage from "./ItemReferencePage"

/** The items reference list, which the add-item form reads its names from. */
export default function ItemReferenceRoute() {
  return (
    <RequirePermission permission="store:read">
      <ItemReferencePage />
    </RequirePermission>
  )
}
