import RequirePermission from "@/features/auth/components/RequirePermission"
import OwnerNotesListPage from "./OwnerNotesListPage"

/** The owner notes still open (reminded every day). */
export default function OwnerNotesRoute() {
  return (
    <RequirePermission permission="owner-notes:read">
      <OwnerNotesListPage done={false} />
    </RequirePermission>
  )
}
