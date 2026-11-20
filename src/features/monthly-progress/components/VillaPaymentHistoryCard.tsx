import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Banknote } from "lucide-react"
import { usePermissions } from "@/features/auth/api"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { toApiError } from "@/shared/api/errors"
import { downloadExport } from "@/shared/export/downloadExport"
import { formatDateTime } from "@/shared/lib/format"
import { toast } from "@/shared/lib/toast"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import CollapsibleCard from "@/shared/ui/CollapsibleCard"
import { ConfirmModal } from "@/shared/ui/Modal"
import {
  usePayVillaMutation,
  useUndoPaymentMutation,
  useVillaPaymentHistoryQuery,
  type VillaPaymentHistoryItem,
} from "../api"
import ManualPaymentFormModal from "./ManualPaymentFormModal"
import VillaPaymentHistoryTable from "./VillaPaymentHistoryTable"

type Props = {
  villaId: string
  villaNumber: string
}

/**
 * A villa's payment history: every payment to its contractor, the latest first, each with the progress it covered and
 * the amount; and where the villa stands now (its progress, the part paid and what is owed). Someone who may record
 * payments pays what is owed from here, enters payments made before the system, or takes back the latest payment (or
 * any payment entered by hand). The history downloads as an Excel file. Loaded the first time it is opened.
 */
export default function VillaPaymentHistoryCard({
  villaId,
  villaNumber,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)
  const { can } = usePermissions()
  const canPay = can("payments:create")
  const canUndo = can("payments:delete")
  const [open, setOpen] = useState(false)
  const query = useVillaPaymentHistoryQuery(villaId, open)
  const pay = usePayVillaMutation()
  const undo = useUndoPaymentMutation()
  const [payOpen, setPayOpen] = useState(false)
  const [undoing, setUndoing] = useState<VillaPaymentHistoryItem | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const items = query.data?.data ?? []
  const summary = query.data?.summary
  const latest = items[0]

  const confirmPay = async () => {
    try {
      const payment = await pay.mutateAsync(villaId)
      toast.success(
        t("monthlyProgress.paid", {
          amount: kwd(payment.amountMinor),
          name: villaNumber,
        }),
      )
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setPayOpen(false)
    }
  }

  const confirmUndo = async () => {
    if (!undoing) return
    try {
      await undo.mutateAsync(undoing.id)
      toast.success(t("monthlyProgress.undone", { name: villaNumber }))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setUndoing(null)
    }
  }

  const exportExcel = async () => {
    setExporting(true)
    try {
      await downloadExport({
        path: `/villas/${villaId}/progress-payments/export`,
        query: {},
        format: "xlsx",
        filenameStem: "payment-history",
      })
      toast.success(t("export.downloaded"))
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setExporting(false)
    }
  }

  const facts = summary
    ? [
        {
          label: t("villaPayments.progressNow"),
          value: `${summary.currentProgress}%`,
        },
        {
          label: t("villaPayments.paidUpTo"),
          value: `${summary.paidProgress}%`,
        },
        {
          label: t("villaPayments.owedNow"),
          value:
            summary.workOrderMinor === null && summary.unpaidProgress > 0
              ? t("monthlyProgress.noWorkOrder")
              : kwd(summary.dueMinor),
          strong: summary.dueMinor > 0,
        },
        {
          label: t("villaPayments.totalPaid"),
          value: kwd(summary.totalPaidMinor),
        },
      ]
    : []

  return (
    <CollapsibleCard
      title={t("villaPayments.title")}
      icon={Banknote}
      open={open}
      onOpenChange={setOpen}
      badges={
        summary && (
          <Badge tone={summary.dueMinor > 0 ? "success" : "neutral"}>
            {t("villaPayments.count", { count: summary.count })}
          </Badge>
        )
      }
    >
      {query.isError ? (
        <p role="alert" className="text-sm text-danger">
          {toApiError(query.error).message}
        </p>
      ) : query.isLoading || !summary ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <dl className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <dt className="text-xs text-muted-foreground">
                    {fact.label}
                  </dt>
                  <dd
                    className={
                      fact.strong
                        ? "mt-0.5 text-sm font-semibold tabular-nums text-success"
                        : "mt-0.5 text-sm font-semibold tabular-nums"
                    }
                    dir="ltr"
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                icon="download"
                disabled={exporting || items.length === 0}
                onClick={() => void exportExcel()}
              >
                {exporting
                  ? t("export.inProgress")
                  : t("villaPayments.exportExcel")}
              </Button>
              {canPay && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setManualOpen(true)}
                >
                  {t("villaPayments.manual.add")}
                </Button>
              )}
              {canPay && (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={summary.dueMinor <= 0 || pay.isPending}
                  onClick={() => setPayOpen(true)}
                >
                  {t("monthlyProgress.pay")}
                </Button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              {t("villaPayments.empty")}
            </p>
          ) : (
            <VillaPaymentHistoryTable
              items={items}
              canUndo={canUndo}
              undoPending={undo.isPending}
              onUndo={setUndoing}
            />
          )}
          {latest && (
            <p className="text-xs text-muted-foreground">
              {t("villaPayments.lastPaid", {
                date: formatDateTime(latest.paidAt),
              })}
            </p>
          )}
        </div>
      )}

      <ConfirmModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        onConfirm={confirmPay}
        closeOnConfirm={false}
        title={t("monthlyProgress.payTitle")}
        confirmLabel={t("monthlyProgress.pay")}
        confirmVariant="primary"
        message={
          summary
            ? t("villaPayments.payBody", {
                amount: kwd(summary.dueMinor),
                name: villaNumber,
                from: summary.paidProgress,
                to: summary.currentProgress,
              })
            : ""
        }
        confirmPending={pay.isPending}
      />
      <ConfirmModal
        open={undoing !== null}
        onClose={() => setUndoing(null)}
        onConfirm={confirmUndo}
        closeOnConfirm={false}
        title={
          undoing?.manual
            ? t("villaPayments.manual.deleteTitle")
            : t("monthlyProgress.undoTitle")
        }
        confirmLabel={
          undoing?.manual ? t("common.delete") : t("monthlyProgress.undo")
        }
        message={
          undoing
            ? t("monthlyProgress.undoBody", {
                amount: kwd(undoing.amountMinor),
                name: villaNumber,
              })
            : ""
        }
        confirmPending={undo.isPending}
      />
      {manualOpen && summary && (
        <ManualPaymentFormModal
          villaId={villaId}
          villaNumber={villaNumber}
          items={items}
          workOrderMinor={summary.workOrderMinor}
          onClose={() => setManualOpen(false)}
        />
      )}
    </CollapsibleCard>
  )
}
