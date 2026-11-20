import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Wallet } from "lucide-react"
import { toApiError } from "@/shared/api/errors"
import { cn } from "@/shared/lib/cn"
import { formatDateTime } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/Badge"
import Button from "@/shared/ui/Button"
import CollapsibleCard from "@/shared/ui/CollapsibleCard"
import { formatBudgetDisplay } from "../api/budget"
import {
  FINANCE_FIELDS,
  formatSharePercent,
  useVillaFinanceQuery,
  type VillaFinance,
} from "../api/villa-finance"
import VillaFinanceForm, { FINANCE_LABEL_KEYS } from "./VillaFinanceForm"

type TileProps = {
  label: string
  value: string
  tone?: "neutral" | "success" | "danger"
}

function Tile({ label, value, tone = "neutral" }: TileProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        tone === "neutral" && "border-border/70 bg-muted/30",
        tone === "success" && "border-success/30 bg-success-soft",
        tone === "danger" && "border-danger/30 bg-danger-soft",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-danger",
        )}
        dir="ltr"
      >
        {value}
      </p>
    </div>
  )
}

type FiguresProps = {
  finance: VillaFinance
  locale: string
}

/** The budget side (budget, variation orders, total) and the cost side (the four costs and their total). */
export function VillaFinanceFigures({ finance, locale }: FiguresProps) {
  const { t } = useTranslation()
  const kwd = (minor: number | null) =>
    minor === null ? "-" : formatBudgetDisplay(minor, "KWD", locale)
  const budgetText =
    finance.budgetMinor !== null
      ? formatBudgetDisplay(
          finance.budgetMinor,
          finance.currency ?? "KWD",
          locale,
        )
      : "-"
  const remaining = finance.remainingMinor
  const over = remaining !== null && remaining < 0
  const total = finance.totalBudgetMinor
  const usedShare =
    total && total > 0
      ? Math.min(100, Math.round((finance.totalCostsMinor / total) * 100))
      : null

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label={t("villas.finance.totalBudget")} value={kwd(total)} />
        <Tile
          label={t("villas.finance.totalCosts")}
          value={kwd(finance.totalCostsMinor)}
        />
        <Tile
          label={t("villas.finance.remaining")}
          value={kwd(remaining)}
          tone={remaining === null ? "neutral" : over ? "danger" : "success"}
        />
      </div>

      {usedShare !== null && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{t("villas.finance.used")}</span>
            <span className="tabular-nums">{usedShare}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-progress-track">
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-500",
                over ? "bg-danger" : "bg-accent",
              )}
              style={{ width: `${usedShare}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <section aria-label={t("villas.finance.budgetSide")}>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("villas.finance.budgetSide")}
          </h4>
          <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
            <li className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span>{t("villas.finance.budget")}</span>
              <span className="font-semibold tabular-nums" dir="ltr">
                {budgetText}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <span>{t("villas.finance.variationOrders")}</span>
              <span className="font-semibold tabular-nums" dir="ltr">
                + {kwd(finance.variationOrdersMinor)}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3 bg-muted/40 px-3 py-2.5 text-sm">
              <span className="font-semibold">
                {t("villas.finance.totalBudget")}
              </span>
              <span className="font-bold tabular-nums" dir="ltr">
                {kwd(total)}
              </span>
            </li>
          </ul>
        </section>
        <section aria-label={t("villas.finance.costSide")}>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("villas.finance.costSide")}
          </h4>
          <ul className="divide-y divide-border/70 rounded-xl border border-border/70">
            {FINANCE_FIELDS.map((field) => {
              const value = finance[field]
              return (
                <li
                  key={field}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span>
                    {t(FINANCE_LABEL_KEYS[field])}
                    {field === "salariesMinor" &&
                      finance.salaryShareBp !== null && (
                        <span className="block text-xs text-muted-foreground">
                          {t("villas.finance.shareOf", {
                            share: formatSharePercent(finance.salaryShareBp),
                          })}
                        </span>
                      )}
                  </span>
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      value === null && "font-normal text-muted-foreground",
                    )}
                    dir="ltr"
                  >
                    {value === null
                      ? t("villas.finance.notEntered")
                      : kwd(value)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}

type Props = {
  villaId: string
  canEdit: boolean
}

/**
 * The Villa Budget card: the villa's budget and its variation orders (the total budget), the work order value, salaries,
 * material values and petty cash (KWD), what they add up to, and what remains of the total budget. Someone who may edit
 * villas changes the budget and the four costs here (the Projects Budgets page edits the same). Loaded when opened.
 */
export default function VillaBudgetCard({ villaId, canEdit }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const query = useVillaFinanceQuery(villaId, open)
  const finance = query.data
  const remaining = finance?.remainingMinor ?? null
  const kwd = (minor: number) => formatBudgetDisplay(minor, "KWD", locale)

  return (
    <CollapsibleCard
      title={t("villas.finance.title")}
      icon={Wallet}
      open={open}
      onOpenChange={setOpen}
      badges={
        finance &&
        remaining !== null && (
          <Badge tone={remaining < 0 ? "danger" : "success"}>
            {remaining < 0
              ? t("villas.finance.overBy", { amount: kwd(-remaining) })
              : t("villas.finance.remainingBadge", { amount: kwd(remaining) })}
          </Badge>
        )
      }
    >
      {query.isError ? (
        <p role="alert" className="text-sm text-danger">
          {toApiError(query.error).message}
        </p>
      ) : !finance ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : editing ? (
        <VillaFinanceForm finance={finance} onDone={() => setEditing(false)} />
      ) : (
        <div className="grid gap-4">
          <VillaFinanceFigures finance={finance} locale={locale} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {finance.updatedAt
                ? t("villas.finance.lastSaved", {
                    at: formatDateTime(finance.updatedAt),
                    name:
                      finance.updatedBy?.name ?? t("villas.hero.unknownUser"),
                  })
                : t("villas.finance.neverSaved")}
            </p>
            {canEdit && (
              <Button
                type="button"
                size="sm"
                icon="edit"
                onClick={() => setEditing(true)}
              >
                {t("villas.finance.edit")}
              </Button>
            )}
          </div>
        </div>
      )}
    </CollapsibleCard>
  )
}
