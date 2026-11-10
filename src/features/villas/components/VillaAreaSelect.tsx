import { useId, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { toApiError } from "@/shared/api/errors"
import { Label } from "@/shared/ui/label"
import { SearchSelect } from "@/shared/ui/search-select"
import { OPTIONS_CAP, useAreaOptionsQuery } from "../api"

// "Name, City"; two areas with the same name and city are told apart by the start of their id.
function optionLabel(
  name: string,
  city: string,
  id: string,
  dup: boolean,
): string {
  const base = `${name}, ${city}`
  if (!dup) return base
  return `${base} (${id.slice(0, 6)}…)`
}

/** The area of a villa: type part of the area or city name to find it. */
export default function VillaAreaSelect({
  value,
  onChange,
  label,
  disabled,
  className,
  error,
}: {
  value: string
  onChange: (id: string) => void
  label: string
  disabled?: boolean
  className?: string
  error?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const { data, isLoading, isError, error: queryError } = useAreaOptionsQuery()
  const forbidden = isError && toApiError(queryError).status === 403
  const options = useMemo(() => data ?? [], [data])

  const choices = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of options) {
      const key = `${o.name}\0${o.city}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return options.map((o) => ({
      value: o.id,
      label: optionLabel(
        o.name,
        o.city,
        o.id,
        (counts.get(`${o.name}\0${o.city}`) ?? 0) > 1,
      ),
    }))
  }, [options])

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {forbidden ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t("villas.form.areaForbidden")}
        </p>
      ) : (
        <SearchSelect
          id={id}
          value={value}
          onChange={onChange}
          options={choices}
          placeholder={t("villas.form.areaSearch")}
          disabled={disabled}
          loading={isLoading}
          aria-invalid={!!error}
          className="bg-card"
        />
      )}
      {options.length === OPTIONS_CAP && (
        <p className="text-xs text-muted-foreground">
          {t("villas.form.areaOptionsIncomplete")}
        </p>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </div>
  )
}
