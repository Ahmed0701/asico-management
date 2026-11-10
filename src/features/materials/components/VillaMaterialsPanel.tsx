import { useState } from "react"
import { useTranslation } from "react-i18next"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import { toast } from "@/shared/lib/toast"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  useDeleteDeliveryMutation,
  useDeliveriesQuery,
  useMaterialsSummaryQuery,
  type MaterialDelivery,
} from "../api"
import DeliveriesTable from "./DeliveriesTable"
import DeliveryFormModal from "./DeliveryFormModal"
import MaterialsBalanceTable from "./MaterialsBalanceTable"
import RequirementsModal from "./RequirementsModal"

/** A villa's materials: what it needs, received and still waits for, its deliveries and their delivery notes. */
export default function VillaMaterialsPanel({ villaId }: { villaId: string }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const canCreate = can("materials:create")
  const canUpdate = can("materials:update")
  const canDelete = can("materials:delete")
  const summary = useMaterialsSummaryQuery(villaId)
  const deliveries = useDeliveriesQuery({ page: 1, limit: 100, villaId })
  const remove = useDeleteDeliveryMutation()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MaterialDelivery | undefined>()
  const [deleting, setDeleting] = useState<MaterialDelivery | null>(null)
  const [requirementsOpen, setRequirementsOpen] = useState(false)

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("materials.deleted"))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDeleting(null)
    }
  }

  const s = summary.data
  const total = deliveries.data?.meta.total ?? 0
  const pending = s?.materials.filter((m) => m.status === "PENDING").length ?? 0

  return (
    <div className="grid gap-4 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {s && (
            <>
              <Badge tone="neutral">
                {t("materials.deliveryCount", { count: s.deliveries })}
              </Badge>
              <Badge tone={pending > 0 ? "danger" : "success"}>
                {pending > 0
                  ? t("materials.materialsPending", { count: pending })
                  : t("materials.allMaterialsIn")}
              </Badge>
              <Badge tone={s.withoutNote > 0 ? "warn" : "success"}>
                {s.withoutNote > 0
                  ? t("materials.notesMissing", { count: s.withoutNote })
                  : t("materials.allNotesIn")}
              </Badge>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdate && (
            <Button
              type="button"
              size="sm"
              icon="edit"
              onClick={() => setRequirementsOpen(true)}
            >
              {t("materials.editRequired")}
            </Button>
          )}
          {canCreate && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon="plus"
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              {t("materials.add")}
            </Button>
          )}
        </div>
      </div>

      {s && <MaterialsBalanceTable materials={s.materials} />}

      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("materials.villaDeliveries")}
      </h3>
      <DeliveriesTable
        rows={deliveries.data?.data ?? []}
        isLoading={deliveries.isLoading}
        showVilla={false}
        canUpdate={canUpdate}
        canDelete={canDelete}
        emptyText={t("materials.villaEmpty")}
        onEdit={(row) => {
          setEditing(row)
          setFormOpen(true)
        }}
        onDelete={setDeleting}
      />
      {total > 100 && (
        <p className="text-xs text-muted-foreground">
          {t("materials.villaMore", { count: total })}
        </p>
      )}

      <DeliveryFormModal
        open={formOpen}
        item={editing}
        villaId={villaId}
        onClose={() => setFormOpen(false)}
      />
      <RequirementsModal
        open={requirementsOpen}
        villaId={villaId}
        current={s?.materials ?? []}
        onClose={() => setRequirementsOpen(false)}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title={t("materials.deleteTitle")}
        message={t("materials.deleteBody", {
          date: deleting?.deliveryDate ?? "",
          villa: deleting?.villa.villaNumber ?? "",
        })}
        confirmLabel={t("common.delete")}
        confirmPending={remove.isPending}
      />
    </div>
  )
}
