import RequirePermission from "@/features/auth/components/RequirePermission"
import OwnerNotesListPage from "./OwnerNotesListPage"

/** The owner notes someone checked as done. */
export default function OwnerNotesDoneRoute() {
  return (
    <RequirePermission permission="owner-notes:read">
      <OwnerNotesListPage done />
    </RequirePermission>
  )
}
