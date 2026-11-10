import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import { FilterSelect } from "@/shared/ui/filter-select"
import { FilterField } from "@/shared/ui/filter-field"
import { Input as UiInput } from "@/shared/ui/input"
import { cn } from "@/shared/lib/cn"
import type { AuditFiltersData, AuditListParams } from "../api"
import type { AuditFieldErrors } from "../api/audit.errors"
import { resolveAuditActionLabel } from "../lib/auditActionLabel"
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
  isDateOnly,
} from "../lib/auditDates"
import SearchableActorSelect from "./SearchableActorSelect"

const filterFieldClass = "min-w-0 w-full"
const filterTriggerClass = "h-9 w-full max-w-none bg-card"

function AuditDateModeToggle({
  mode,
  onChange,
}: {
  mode: "date" | "datetime"
  onChange: (mode: "date" | "datetime") => void
}) {
  const { t } = useTranslation()
  const groupLabel = t("audit.dateMode")

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="inline-flex shrink-0 gap-1 rounded-lg border border-border bg-muted/30 p-1"
    >
      <Button
        type="button"
        size="sm"
        variant={mode === "date" ? "primary" : "secondary"}
        aria-pressed={mode === "date"}
        className="h-8 min-w-0 px-2.5"
        onClick={() => onChange("date")}
      >
        {t("audit.dateUtcDay")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={mode === "datetime" ? "primary" : "secondary"}
        aria-pressed={mode === "datetime"}
        className="h-8 min-w-0 px-2.5"
        onClick={() => onChange("datetime")}
      >
        {t("audit.dateTimeLocal")}
      </Button>
    </div>
  )
}

export default function AuditLogFilters({
  params,
  setParam,
  filters,
  fieldErrors,
}: {
  params: AuditListParams
  setParam: (key: string, value: string | undefined) => void
  filters: AuditFiltersData | undefined
  fieldErrors: AuditFieldErrors
}) {
  const { t } = useTranslation()
  const fromId = useId()
  const toId = useId()
  const [dateMode, setDateMode] = useState<"date" | "datetime">(() =>
    params.from && !isDateOnly(params.from) ? "datetime" : "date",
  )

  const dateInputType = dateMode === "date" ? "date" : "datetime-local"
  const fromDisplay =
    dateMode === "datetime" && params.from && !isDateOnly(params.from)
      ? isoToDatetimeLocal(params.from)
      : (params.from ?? "")
  const toDisplay =
    dateMode === "datetime" && params.to && !isDateOnly(params.to)
      ? isoToDatetimeLocal(params.to)
      : (params.to ?? "")

  const setFrom = (raw: string) => {
    if (!raw) {
      setParam("from", undefined)
      return
    }
    if (dateMode === "date") setParam("from", raw)
    else {
      const iso = datetimeLocalToIso(raw)
      if (iso) setParam("from", iso)
    }
  }
  const setTo = (raw: string) => {
    if (!raw) {
      setParam("to", undefined)
      return
    }
    if (dateMode === "date") setParam("to", raw)
    else {
      const iso = datetimeLocalToIso(raw)
      if (iso) setParam("to", iso)
    }
  }

  return (
    <section
      className="mb-4 rounded-lg border border-border bg-card/40 p-4"
      aria-label={t("audit.filtersSection")}
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <SearchableActorSelect
          className={cn(
            filterFieldClass,
            "col-span-2 md:col-span-2 lg:col-span-2",
          )}
          label={t("audit.actor")}
          value={params.actorId ?? ""}
          onChange={(v) => setParam("actorId", v || undefined)}
          actors={filters?.actors ?? []}
        />
        <FilterSelect
          className={filterFieldClass}
          triggerClassName={filterTriggerClass}
          label={t("audit.action")}
          value={params.action ?? ""}
          onChange={(v) => setParam("action", v || undefined)}
          options={(filters?.actions ?? []).map((a) => ({
            value: a,
            label: resolveAuditActionLabel(a, filters?.actionLabels),
          }))}
        />
        <FilterSelect
          className={filterFieldClass}
          triggerClassName={filterTriggerClass}
          label={t("audit.entity")}
          value={params.entity ?? ""}
          onChange={(v) => setParam("entity", v || undefined)}
          options={(filters?.entities ?? []).map((code) => ({
            value: code,
            label: filters?.entityLabels[code] ?? code,
          }))}
        />
        <div
          className={cn(
            filterFieldClass,
            "col-span-2 md:col-span-3 lg:col-span-4",
          )}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <span className="text-center text-xs font-normal text-muted-foreground">
                {t("audit.dateMode")} ({t("audit.utcHint")})
              </span>
              <div className="flex justify-center">
                <AuditDateModeToggle mode={dateMode} onChange={setDateMode} />
              </div>
            </div>
            <FilterField
              label={t("common.from")}
              htmlFor={fromId}
              className="min-w-0 lg:col-span-1"
              error={fieldErrors.from}
            >
              <UiInput
                id={fromId}
                type={dateInputType}
                value={fromDisplay}
                onChange={(e) => setFrom(e.target.value)}
                aria-invalid={!!fieldErrors.from}
                className="h-9 w-full bg-card"
                dir="ltr"
              />
            </FilterField>
            <FilterField
              label={t("common.to")}
              htmlFor={toId}
              className="min-w-0 lg:col-span-1"
              error={fieldErrors.to}
            >
              <UiInput
                id={toId}
                type={dateInputType}
                value={toDisplay}
                onChange={(e) => setTo(e.target.value)}
                aria-invalid={!!fieldErrors.to}
                className="h-9 w-full bg-card"
                dir="ltr"
              />
            </FilterField>
          </div>
        </div>
      </div>
    </section>
  )
}
