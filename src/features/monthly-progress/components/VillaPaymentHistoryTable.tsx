import { useTranslation } from "react-i18next"
import { formatBudgetDisplay } from "@/features/villas/api/budget"
import { formatDate, formatDateTime } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { VillaPaymentHistoryItem } from "../api"

type Props = {
  /** The latest first. */
  items: VillaPaymentHistoryItem[]
  canUndo: boolean
  undoPending: boolean
  /** Takes back a payment: the latest, or any entered by hand. */
  onUndo: (item: VillaPaymentHistoryItem) => void
}

/** A villa's payments: when, to which contractor, the progress each covered, the amount, and who recorded it. */
export default function VillaPaymentHistoryTable({
  items,
  canUndo,
  undoPending,
  onUndo,
}: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)
  const head = "px-3 py-2"

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-180">
        <TableHeader>
          <TableRow className="list-head-row">
            <TableHead className={head}>{t("villaPayments.date")}</TableHead>
            <TableHead className={head}>
              {t("monthlyProgress.contractor")}
            </TableHead>
            <TableHead className={head}>
              {t("villaPayments.progress")}
            </TableHead>
            <TableHead className={`${head} text-end`}>
              {t("villaPayments.amount")}
            </TableHead>
            <TableHead className={`${head} text-end`}>
              {t("monthlyProgress.workOrder")}
            </TableHead>
            <TableHead className={head}>{t("villaPayments.paidBy")}</TableHead>
            {canUndo && (
              <TableHead className={head}>
                <span className="sr-only">{t("common.actions")}</span>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap">
                <div className="grid gap-1">
                  <span>
                    {item.manual
                      ? formatDate(item.paidAt.slice(0, 10))
                      : formatDateTime(item.paidAt)}
                  </span>
                  {item.manual && (
                    <span className="justify-self-start">
                      <Badge tone="info">
                        {t("villaPayments.manual.badge")}
                      </Badge>
                    </span>
                  )}
                  {item.note && (
                    <span
                      className="max-w-56 truncate text-muted-foreground"
                      dir="auto"
                      title={item.note}
                    >
                      {item.note}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-3 py-2.5 text-sm" dir="auto">
                {item.contractor?.name ?? (
                  <span className="text-muted-foreground">
                    {t("monthlyProgress.duesNoContractor")}
                  </span>
                )}
              </TableCell>
              <TableCell className="px-3 py-2.5 text-sm tabular-nums whitespace-nowrap">
                {t("villaPayments.range", {
                  from: item.fromRatio,
                  to: item.ratio,
                })}
                <span className="ms-1.5 text-xs font-semibold text-success">
                  +{Math.round((item.ratio - item.fromRatio) * 10) / 10}%
                </span>
              </TableCell>
              <TableCell
                className="px-3 py-2.5 text-end text-sm font-semibold tabular-nums whitespace-nowrap"
                dir="ltr"
              >
                {kwd(item.amountMinor)}
              </TableCell>
              <TableCell
                className="px-3 py-2.5 text-end text-xs text-muted-foreground tabular-nums whitespace-nowrap"
                dir="ltr"
              >
                {kwd(item.workOrderMinor)}
              </TableCell>
              <TableCell className="px-3 py-2.5 text-xs" dir="auto">
                {item.paidBy?.name ?? "-"}
              </TableCell>
              {canUndo && (
                <TableCell className="px-3 py-2.5">
                  {(index === 0 || item.manual) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={undoPending}
                      onClick={() => onUndo(item)}
                    >
                      {item.manual
                        ? t("common.delete")
                        : t("monthlyProgress.undo")}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
