import { useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  useStoreMovementsQuery,
  useUndoStoreMovementMutation,
  type StoreMovement,
} from "../api"
import { formatChange, unitLabel } from "../lib/storeFormat"
import StoreMovementModal from "./StoreMovementModal"
import StoreMovementsTable from "./StoreMovementsTable"

/** The store material issued to a villa (separate from the factory deliveries), and issuing more to it. */
export default function VillaStorePanel({ villaId }: { villaId: string }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canMove = can("store:update")
  const { data, isLoading } = useStoreMovementsQuery({
    page: 1,
    limit: 200,
    villaId,
  })
  const undo = useUndoStoreMovementMutation()
  const [issuing, setIssuing] = useState(false)
  const [undoing, setUndoing] = useState<StoreMovement | null>(null)

  const confirmUndo = async () => {
    if (!undoing) return
    try {
      await undo.mutateAsync(undoing.id)
      toast.success(t("store.undone", { name: undoing.item.name }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setUndoing(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t("store.villaHint")}</p>
        {canMove && (
          <Button
            type="button"
            size="sm"
            icon="upload"
            onClick={() => setIssuing(true)}
          >
            {t("store.issueToVilla")}
          </Button>
        )}
      </div>
      <StoreMovementsTable
        rows={data?.data ?? []}
        loading={isLoading}
        showVilla={false}
        showStore
        canUndo={canMove}
        onUndo={setUndoing}
      />
      <StoreMovementModal
        preset={issuing ? { kind: "ISSUE", villaId } : null}
        onClose={() => setIssuing(false)}
      />
      <ConfirmModal
        open={undoing !== null}
        onClose={() => setUndoing(null)}
        onConfirm={confirmUndo}
        title={t("store.undoTitle")}
        message={t("store.undoBody", {
          name: undoing?.item.name ?? "",
          change: undoing
            ? `${formatChange(undoing.change)} ${unitLabel(undoing.item.unit)}`
            : "",
        })}
        confirmLabel={t("store.undo")}
        confirmPending={undo.isPending}
      />
    </div>
  )
}
