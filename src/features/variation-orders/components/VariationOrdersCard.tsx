import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router"
import { useTranslation } from "react-i18next"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { toApiError } from "@/shared/api/errors"
import { cn } from "@/shared/lib/cn"
import { toast } from "@/shared/lib/toast"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { ConfirmModal } from "@/shared/ui/Modal"
import { Card } from "@/shared/ui/PageHeader"
import {
  useDeleteVariationOrderMutation,
  useUpdateVariationOrderMutation,
  useVariationOrdersQuery,
  type VariationOrder,
  type VariationOrderStatus,
} from "../api"
import VariationOrderFilesModal from "./VariationOrderFilesModal"
import VariationOrderFormModal from "./VariationOrderFormModal"
import VariationOrderNotesModal from "./VariationOrderNotesModal"
import VariationOrdersTable from "./VariationOrdersTable"

type Props = {
  villaId: string
  canEdit: boolean
}

/**
 * The Variation Orders of a villa, folded like the MEW details: VO number, amount, date added, Pending or Paid, notes,
 * and their PDF files. Loaded the first time it is opened.
 */
export default function VariationOrdersCard({ villaId, canEdit }: Props) {
  const { t, i18n } = useTranslation()
  const [searchParams] = useSearchParams()
  const linked = searchParams.get("variationOrders") === "open"
  const [open, setOpen] = useState(linked)
  const cardRef = useRef<HTMLDivElement>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<VariationOrder | undefined>()
  const [deleting, setDeleting] = useState<VariationOrder | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [filesId, setFilesId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const query = useVariationOrdersQuery(villaId, open)
  const update = useUpdateVariationOrderMutation()
  const remove = useDeleteVariationOrderMutation()

  useEffect(() => {
    if (!linked) return
    setOpen(true)
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [linked])

  const rows = query.data?.data ?? []
  const totals = query.data?.totals
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)
  // Looked up by id, so the dialogs show the row as it is after a change.
  const viewing = rows.find((row) => row.id === viewingId) ?? null
  const filesOf = rows.find((row) => row.id === filesId) ?? null

  const changeStatus = async (
    row: VariationOrder,
    next: VariationOrderStatus,
  ) => {
    setBusyId(row.id)
    try {
      await update.mutateAsync({
        id: row.id,
        input: { status: next },
        write: { ifMatch: row.version },
      })
      toast.success(
        t(
          next === "PAID"
            ? "variationOrders.markedPaid"
            : "variationOrders.markedPending",
          { name: row.voNumber },
        ),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
      void query.refetch()
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await remove.mutateAsync({ id: deleting.id, version: deleting.version })
      toast.success(t("variationOrders.deleted", { name: deleting.voNumber }))
      setDeleting(null)
    } catch (err) {
      toast.error(toApiError(err).message)
      void query.refetch()
    }
  }

  return (
    <div ref={cardRef} className="scroll-mt-4">
      <Card className="mb-4 overflow-hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start text-sm font-medium hover:bg-muted/40"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="flex items-center gap-2">
            {t("variationOrders.title")}
            {query.data && rows.length > 0 && (
              <Badge tone="neutral">{rows.length}</Badge>
            )}
          </span>
          <Icon
            name="chevronDown"
            size={18}
            className={cn(
              "shrink-0 text-muted-foreground transition",
              open && "rotate-180",
            )}
          />
        </button>
        {open && (
          <div className="grid gap-4 border-t border-border p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span>
                  <span className="text-muted-foreground">
                    {t("variationOrders.totalPending")}:{" "}
                  </span>
                  <span className="font-medium tabular-nums text-progress">
                    {kwd(totals?.pendingMinor ?? 0)}
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">
                    {t("variationOrders.totalPaid")}:{" "}
                  </span>
                  <span className="font-medium tabular-nums text-success">
                    {kwd(totals?.paidMinor ?? 0)}
                  </span>
                </span>
              </div>
              {canEdit && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon="plus"
                  onClick={() => {
                    setEditing(undefined)
                    setFormOpen(true)
                  }}
                >
                  {t("variationOrders.add")}
                </Button>
              )}
            </div>
            {query.isError ? (
              <p role="alert" className="text-sm text-danger">
                {toApiError(query.error).message}
              </p>
            ) : (
              <VariationOrdersTable
                rows={rows}
                loading={query.isLoading}
                canEdit={canEdit}
                busyId={busyId}
                kwd={kwd}
                onStatus={(row, next) => void changeStatus(row, next)}
                onNotes={(row) => setViewingId(row.id)}
                onFiles={(row) => setFilesId(row.id)}
                onEdit={(row) => {
                  setEditing(row)
                  setFormOpen(true)
                }}
                onDelete={setDeleting}
              />
            )}
          </div>
        )}

        <VariationOrderFormModal
          open={formOpen}
          villaId={villaId}
          item={editing}
          onClose={() => setFormOpen(false)}
        />
        <VariationOrderNotesModal
          item={viewing}
          amount={viewing ? kwd(viewing.amountMinor) : ""}
          onClose={() => setViewingId(null)}
        />
        <VariationOrderFilesModal
          item={filesOf}
          canEdit={canEdit}
          onClose={() => setFilesId(null)}
        />
        <ConfirmModal
          open={deleting !== null}
          onClose={() => setDeleting(null)}
          onConfirm={confirmDelete}
          title={t("variationOrders.deleteTitle")}
          message={t("variationOrders.deleteBody", {
            name: deleting?.voNumber ?? "",
            amount: deleting ? kwd(deleting.amountMinor) : "",
          })}
          confirmLabel={t("common.delete")}
          confirmPending={remove.isPending}
        />
      </Card>
    </div>
  )
}
