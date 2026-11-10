import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { VillaMarkDto, VillaDetail } from "../api"
import { formatDateTime } from "@/shared/lib/format"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { Card } from "@/shared/ui/PageHeader"
import { Badge } from "@/shared/ui/Badge"
import { DetailField, DetailFieldGrid } from "@/shared/ui/detail-fields"
import { cn } from "@/shared/lib/cn"
import Icon from "@/shared/ui/Icon"
import MewStateSelect from "./MewStateSelect"

// Everything the villa has with MEW, like the registry details: the two MEW states, and the three MEW steps
// (on the follow-up list, added for inspection, inspection passed), each with when and by whom.
export default function VillaDetailMewCard({ villa }: { villa: VillaDetail }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Card className="mb-4 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start text-sm font-medium hover:bg-muted/40"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          {t("villas.mewDetails")}
          {villa.mewInspectionPassed && (
            <Badge tone="success">{t("villas.mewPassed")}</Badge>
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
        <div className="border-t border-border p-4 sm:p-5">
          <DetailFieldGrid columns="two">
            <DetailField boxed label={t("mewFollowUp.acState")}>
              <MewStateSelect
                value={villa.mewAcState}
                label={t("mewFollowUp.acState")}
                canEdit={false}
                onChange={() => {}}
              />
            </DetailField>
            <DetailField boxed label={t("mewFollowUp.elecState")}>
              <MewStateSelect
                value={villa.mewElecState}
                label={t("mewFollowUp.elecState")}
                canEdit={false}
                onChange={() => {}}
              />
            </DetailField>
            <DetailField boxed label={t("mewFollowUp.inspectionDate")}>
              {villa.mewInspectionDate ? (
                <time
                  dateTime={villa.mewInspectionDate}
                  className="text-sm tabular-nums"
                >
                  {formatCalendarDateUtc(
                    `${villa.mewInspectionDate}T00:00:00.000Z`,
                  )}
                </time>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t("villas.mewNotScheduled")}
                </span>
              )}
            </DetailField>
            <DetailField boxed label={t("villas.mewFollowUpStep")}>
              <MewStep mark={villa.mewFollowUp} yes={t("villas.mewYes")} />
            </DetailField>
            <DetailField boxed label={t("villas.mewInspectionStep")}>
              <MewStep mark={villa.mewInspection} yes={t("villas.mewYes")} />
            </DetailField>
            <DetailField boxed label={t("villas.mewPassedStep")}>
              <MewStep
                mark={villa.mewInspectionPassed}
                yes={t("villas.mewPassed")}
                no={t("villas.mewNotPassed")}
              />
            </DetailField>
          </DetailFieldGrid>
        </div>
      )}
    </Card>
  )
}

// One MEW step: yes (with when and by whom) or no.
function MewStep({
  mark,
  yes,
  no,
}: {
  mark: VillaMarkDto | null
  yes: string
  no?: string
}) {
  const { t } = useTranslation()
  if (!mark) {
    return (
      <span className="text-sm text-muted-foreground">
        {no ?? t("villas.mewNo")}
      </span>
    )
  }
  return (
    <div className="space-y-0.5 text-sm">
      <Badge tone="success">{yes}</Badge>
      <p className="tabular-nums text-muted-foreground">
        {formatDateTime(mark.at)}
        {mark.by
          ? ` · ${t("villas.readyMarkedBy", { name: mark.by.name })}`
          : ""}
      </p>
    </div>
  )
}
