import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { toApiError } from "@/shared/api/errors"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { OPTIONS_CAP, useContractorOptions } from "../api"

const NONE = "__none__"

function optionLabel(name: string, id: string, duplicateName: boolean): string {
  if (!duplicateName) return name
  return `${name} (${id.slice(0, 6)}…)`
}

export default function ContractorSelect({
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
  const { data, isLoading, isError, error } = useContractorOptions()
  const [filter, setFilter] = useState("")

  const forbidden = isError && toApiError(error).status === 403

  const options = data ?? []
  const nameCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const o of options) {
      counts.set(o.name, (counts.get(o.name) ?? 0) + 1)
    }
    return counts
  }, [options])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) => o.name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q),
    )
  }, [options, filter])

  const incomplete = options.length === OPTIONS_CAP
  const selectValue = value || NONE

  if (forbidden) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Label className="text-xs font-normal text-muted-foreground">
          {label}
        </Label>
        <Select disabled value={NONE}>
          <SelectTrigger size="sm" className="h-9 bg-muted opacity-70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>
              {t("contractors.selectForbidden")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <Input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t("contractors.selectSearch")}
        disabled={disabled || isLoading}
        className="h-8"
      />
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === NONE ? "" : v)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger size="sm" className="h-9 bg-card" aria-label={label}>
          <SelectValue placeholder={t("contractors.selectPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>
            {t("contractors.selectPlaceholder")}
          </SelectItem>
          {filtered.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {optionLabel(o.name, o.id, (nameCounts.get(o.name) ?? 0) > 1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {incomplete && (
        <p className="text-xs text-muted-foreground">
          {t("contractors.optionsIncomplete")}
        </p>
      )}
    </div>
  )
}
