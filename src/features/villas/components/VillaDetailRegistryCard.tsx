import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { VillaDetail } from "../api"
import { formatBudgetDisplay } from "../api"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { Card } from "@/shared/ui/PageHeader"
import { DetailField, DetailFieldGrid } from "@/shared/ui/detail-fields"
import ProgressCell from "@/shared/list/ProgressCell"
import { cn } from "@/shared/lib/cn"
import Icon from "@/shared/ui/Icon"

export default function VillaDetailRegistryCard({
  villa,
}: {
  villa: VillaDetail
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const [open, setOpen] = useState(false)

  return (
    <Card className="mb-4 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start text-sm font-medium hover:bg-muted/40"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {t("villas.registryDetails")}
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
        <div className="border-t border-border p-4 sm:p-5">
          <DetailFieldGrid columns="two">
            <DetailField boxed label={t("villas.location")}>
              <span dir="auto">{villa.location}</span>
            </DetailField>
            <DetailField boxed label={t("villas.contractor")}>
              <span dir="auto">{villa.contractor?.name ?? "-"}</span>
            </DetailField>
            <DetailField boxed label={t("villas.electricalEngineer")}>
              <span dir="auto">{villa.electricalEngineer?.name ?? "-"}</span>
            </DetailField>
            <DetailField boxed label={t("villas.civilEngineer")}>
              <span dir="auto">{villa.civilEngineer.name}</span>
            </DetailField>
            <DetailField boxed label={t("villas.startDate")}>
              {villa.startDate ? (
                <time dateTime={villa.startDate} className="tabular-nums">
                  {formatCalendarDateUtc(`${villa.startDate}T00:00:00.000Z`)}
                </time>
              ) : (
                "-"
              )}
            </DetailField>
            <DetailField boxed label={t("villas.targetDate")}>
              {villa.targetDate ? (
                <time dateTime={villa.targetDate} className="tabular-nums">
                  {formatCalendarDateUtc(`${villa.targetDate}T00:00:00.000Z`)}
                </time>
              ) : (
                "-"
              )}
            </DetailField>
            <DetailField boxed label={t("villas.budgetMajor")}>
              <span className="tabular-nums" dir="ltr">
                {formatBudgetDisplay(villa.budgetMinor, villa.currency, locale)}
              </span>
            </DetailField>
            <DetailField boxed label={t("villas.progress")}>
              <div className="max-w-xs">
                <ProgressCell value={villa.progress} />
              </div>
            </DetailField>
          </DetailFieldGrid>
        </div>
      )}
    </Card>
  )
}
