import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { usePermissions } from "@/features/auth/api"
import { toApiError } from "@/shared/api/errors"
import {
  idempotencyWrite,
  ifMatchWrite,
  useIdempotencyKey,
} from "@/shared/api/write-safety"
import { FilterSelect } from "@/shared/ui/filter-select"
import { ConfirmModal } from "@/shared/ui/Modal"
import PageHeader from "@/shared/ui/PageHeader"
import ListPageHeaderActions from "@/shared/list/ListPageHeaderActions"
import {
  elecPhasesKeys,
  useDeleteElecPhaseMutation,
  useElecPhasesListParams,
  useElecPhasesListQuery,
  useElecPhasesOrderSnapshotQuery,
  useReorderElecPhasesMutation,
  useUpdateElecPhaseMutation,
  type ElecPhase,
} from "../api"
import ElecPhaseFormModal from "../components/ElecPhaseFormModal"
import ElecPhasesListErrorBanner from "../components/ElecPhasesListErrorBanner"
import ElecPhasesListFooter from "../components/ElecPhasesListFooter"
import ElecPhasesTable from "../components/ElecPhasesTable"
import { toast } from "@/shared/lib/toast"

export default function ElecPhasesPage() {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const qc = useQueryClient()
  const { params, setParam, setPage, setLimit } = useElecPhasesListParams()
  const { data, isLoading, isError, error, refetch } = useElecPhasesListQuery()
  const remove = useDeleteElecPhaseMutation()
  const reorder = useReorderElecPhasesMutation()
  const deactivate = useUpdateElecPhaseMutation()
  const reorderIdempotency = useIdempotencyKey(false)

  const canCreate = can("elec-phases:create")
  const canUpdate = can("elec-phases:update")
  const canDelete = can("elec-phases:delete")

  const { data: orderSnapshot } = useElecPhasesOrderSnapshotQuery(canUpdate)

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | undefined>()
  const [deleting, setDeleting] = useState<ElecPhase | null>(null)
  const [deactivateOffer, setDeactivateOffer] = useState<ElecPhase | null>(null)
  const [savedBanner, setSavedBanner] = useState(false)

  const rows = data?.data ?? []
  const meta = data?.meta
  const apiError = isError ? toApiError(error) : null

  const orderPhases = orderSnapshot?.data ?? []
  // The ratios of the active phases, added up: they do not have to make 100, but it helps to see the total.
  const activeRatioTotal = orderPhases
    .filter((phase) => phase.status === "ACTIVE")
    .reduce((total, phase) => total + phase.progressRatio, 0)
  const orderIndexById = useMemo(() => {
    const map = new Map<string, number>()
    orderPhases.forEach((p, i) => map.set(p.id, i))
    return map
  }, [orderPhases])

  const statusFiltered = !!params.status
  const canReorder =
    canUpdate && !statusFiltered && !reorder.isPending && orderPhases.length > 0

  const reorderBlockedReason = statusFiltered
    ? t("elecPhases.reorderNeedsFullList")
    : undefined

  const showGlobalError = useMemo(
    () =>
      apiError &&
      (apiError.status === 403 ||
        apiError.status >= 500 ||
        apiError.code === "NETWORK_ERROR"),
    [apiError],
  )

  const openCreate = () => {
    setEditId(undefined)
    setFormOpen(true)
  }

  const openEdit = (row: ElecPhase) => {
    setEditId(row.id)
    setFormOpen(true)
  }

  const swapOrder = async (id: string, direction: -1 | 1) => {
    const ids = orderPhases.map((p) => p.id)
    const index = ids.indexOf(id)
    if (index < 0) return
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    try {
      await reorder.mutateAsync({
        input: { ids },
        write: idempotencyWrite(reorderIdempotency.getKey()),
      })
      reorderIdempotency.resetKey()
    } catch (err) {
      const parsed = toApiError(err)
      reorderIdempotency.markRejected()
      if (parsed.code === "ELEC_PHASES_CHANGED") {
        toast.error(t("elecPhases.phasesChanged"))
        void refetch()
        void qc.invalidateQueries({ queryKey: elecPhasesKeys.orderSnapshot() })
        return
      }
      toast.error(parsed.message)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({
        id: deleting.id,
        write: { ifMatch: deleting.version },
      })
      setDeleting(null)
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.code === "ELEC_PHASE_NOT_FOUND" || parsed.status === 404) {
        toast.error(t("elecPhases.deleteAlreadyGone"))
        setDeleting(null)
        void refetch()
        return
      }
      if (parsed.code === "ELEC_PHASE_IN_USE") {
        setDeactivateOffer(deleting)
        setDeleting(null)
        return
      }
      if (parsed.code === "VERSION_CONFLICT") {
        toast.error(parsed.message)
        setDeleting(null)
        void refetch()
        return
      }
      toast.error(parsed.message || t("common.listErrorTitle"))
      setDeleting(null)
    }
  }

  const confirmDeactivateInstead = async () => {
    if (!deactivateOffer) return
    try {
      await deactivate.mutateAsync({
        id: deactivateOffer.id,
        input: { status: "INACTIVE" },
        write: ifMatchWrite(deactivateOffer.version),
      })
      setDeactivateOffer(null)
      setSavedBanner(true)
    } catch (err) {
      const parsed = toApiError(err)
      toast.error(parsed.message)
      setDeactivateOffer(null)
      void refetch()
    }
  }

  return (
    <>
      <PageHeader
        title={t("elecPhases.title")}
        subtitle={t("elecPhases.subtitle")}
        actions={
          canCreate ? (
            <ListPageHeaderActions
              showImport={false}
              add={{ label: t("elecPhases.add"), onClick: openCreate }}
            />
          ) : undefined
        }
      />
      {savedBanner && (
        <p className="mb-3 rounded-lg bg-closed-soft px-3 py-2 text-sm text-closed">
          {t("common.saved")}
        </p>
      )}
      <div className="mb-3 max-w-xs">
        <FilterSelect
          label={t("elecPhases.statusFilter")}
          value={params.status ?? ""}
          onChange={(v) => setParam("status", v || undefined)}
          options={[
            { value: "ACTIVE", label: t("elecPhases.statusLabels.ACTIVE") },
            { value: "INACTIVE", label: t("elecPhases.statusLabels.INACTIVE") },
          ]}
        />
      </div>
      <ElecPhasesListErrorBanner
        error={showGlobalError ? apiError : null}
        onRetry={() => void refetch()}
      />
      <ElecPhasesTable
        rows={rows}
        isLoading={isLoading && !data}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canReorder={canReorder}
        reorderBlockedReason={reorderBlockedReason}
        reorderPending={reorder.isPending}
        orderIndexById={orderIndexById}
        orderTotal={orderPhases.length}
        onEdit={openEdit}
        onDelete={setDeleting}
        onMoveUp={(row) => void swapOrder(row.id, -1)}
        onMoveDown={(row) => void swapOrder(row.id, 1)}
      />
      {orderPhases.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          {t("elecPhases.ratioTotal", { total: activeRatioTotal })}
        </p>
      )}
      {meta && meta.total > 0 && (
        <ElecPhasesListFooter
          meta={meta}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
          onGoLastPage={() => setPage(meta.totalPages)}
        />
      )}
      {!isLoading && !isError && rows.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t("elecPhases.empty")}
        </p>
      )}
      <ElecPhaseFormModal
        open={formOpen}
        phaseId={editId}
        onClose={() => setFormOpen(false)}
        onSaved={() => setSavedBanner(true)}
        onDeletedWhileEditing={() => {
          setFormOpen(false)
          void refetch()
        }}
      />
      <ConfirmModal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        closeOnConfirm={false}
        title={t("elecPhases.deleteTitle")}
        message={t("elecPhases.deleteBody", { name: deleting?.name ?? "" })}
        confirmPending={remove.isPending}
      />
      <ConfirmModal
        open={deactivateOffer !== null}
        onClose={() => setDeactivateOffer(null)}
        onConfirm={confirmDeactivateInstead}
        title={t("elecPhases.deactivateInsteadTitle")}
        message={t("elecPhases.deactivateInsteadBody", {
          name: deactivateOffer?.name ?? "",
        })}
        confirmLabel={t("elecPhases.deactivateInsteadAction")}
        confirmVariant="primary"
        confirmPending={deactivate.isPending}
      />
    </>
  )
}
