import { useId, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { toApiError } from "@/shared/api/errors"
import { Label } from "@/shared/ui/label"
import { SearchSelect } from "@/shared/ui/search-select"
import { OPTIONS_CAP, useCivilEngineerOptions } from "../api"

// Two engineers with the same name are told apart by the start of their id.
function optionLabel(name: string, id: string, duplicateName: boolean): string {
  if (!duplicateName) return name
  return `${name} (${id.slice(0, 6)}…)`
}

/** The civil engineer of a villa: type part of the name to find them. */
export default function CivilEngineerSelect({
  value,
  onChange,
  label,
  disabled,
  className,
}: {
  value: string
  onChange: (id: string) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const { data, isLoading, isError, error } = useCivilEngineerOptions()
  const forbidden = isError && toApiError(error).status === 403
  const options = useMemo(() => data ?? [], [data])

  const choices = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of options) counts.set(o.name, (counts.get(o.name) ?? 0) + 1)
    return options.map((o) => ({
      value: o.id,
      label: optionLabel(o.name, o.id, (counts.get(o.name) ?? 0) > 1),
    }))
  }, [options])

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {forbidden ? (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {t("engineers.selectForbidden")}
        </p>
      ) : (
        <SearchSelect
          id={id}
          value={value}
          onChange={onChange}
          options={choices}
          placeholder={t("engineers.selectSearch")}
          disabled={disabled}
          loading={isLoading}
          className="bg-card"
        />
      )}
      {options.length === OPTIONS_CAP && (
        <p className="text-xs text-muted-foreground">
          {t("engineers.optionsIncomplete")}
        </p>
      )}
    </div>
  )
}
