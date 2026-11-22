import { useTranslation } from "react-i18next"
import { AlertTriangle } from "lucide-react"
import { ConfirmModal } from "@/shared/ui/Modal"
import { useVillaDeletionImpactQuery, type VillaDeletionImpact } from "../api"

// The order the records are listed in.
const KINDS: (keyof VillaDeletionImpact)[] = [
  "openWorks",
  "smallWorks",
  "siteReports",
  "labour",
  "deliveries",
  "materialOrders",
  "ownerNotes",
  "foremanMissions",
  "payments",
  "progressPayments",
  "variationOrders",
  "overheadExpenses",
  "documents",
  "images",
  "inspectionReports",
]

/**
 * Confirms deleting a villa, and says first what goes with it: every open work, small work, payment... that belongs to
 * it is deleted too.
 */
export default function VillaDeleteDialog({
  villa,
  pending,
  onConfirm,
  onClose,
}: {
  /** The villa to delete; null keeps the dialog closed. */
  villa: { id: string; villaNumber: string } | null
  pending: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const impact = useVillaDeletionImpactQuery(villa?.id)
  const records = impact.data
    ? KINDS.filter((kind) => impact.data[kind] > 0)
    : []

  return (
    <ConfirmModal
      open={!!villa}
      title={t("villas.deleteTitle")}
      message={t("villas.deleteBody", { name: villa?.villaNumber ?? "" })}
      confirmLabel={t("common.delete")}
      onConfirm={onConfirm}
      onClose={onClose}
      confirmPending={pending || impact.isLoading}
    >
      <div className="mt-3 rounded-lg border border-danger/30 bg-danger-soft/50 p-3 text-sm">
        {impact.isLoading ? (
          <p className="text-muted-foreground">
            {t("villas.deleteImpact.loading")}
          </p>
        ) : impact.isError ? (
          <p className="text-muted-foreground">
            {t("villas.deleteImpact.failed")}
          </p>
        ) : records.length === 0 ? (
          <p className="text-muted-foreground">
            {t("villas.deleteImpact.nothing")}
          </p>
        ) : (
          <>
            <p className="flex items-center gap-2 font-medium text-danger">
              <AlertTriangle size={14} aria-hidden />
              {t("villas.deleteImpact.title")}
            </p>
            <ul
              aria-label={t("villas.deleteImpact.title")}
              className="mt-2 grid gap-1 sm:grid-cols-2"
            >
              {records.map((kind) => (
                <li key={kind} className="flex justify-between gap-3">
                  <span>{t(`villas.deleteImpact.kinds.${kind}`)}</span>
                  <span className="font-semibold tabular-nums">
                    {impact.data![kind]}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </ConfirmModal>
  )
}
