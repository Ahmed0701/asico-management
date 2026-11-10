import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"

const ALL = "__all__"

export default function SearchableActorSelect({
  label,
  value,
  onChange,
  actors,
  unknownLabel,
  className,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  actors: {
    id: string
    name: string
  }[]
  unknownLabel?: string
  className?: string
}) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState("")
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return actors
    return actors.filter(
      (a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q),
    )
  }, [actors, filter])

  const selectedInList = actors.some((a) => a.id === value)
  const displayUnknown = value && !selectedInList
  const selectValue = value || ALL

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-end">
        <Input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("audit.filterActorSearch")}
          aria-label={t("audit.filterActorSearch")}
          className="h-8 min-w-0"
        />
        <Select
          value={selectValue}
          onValueChange={(v) => onChange(v === ALL ? "" : v)}
        >
          <SelectTrigger
            size="sm"
            className="h-9 min-w-0 w-full bg-card"
            aria-label={label}
          >
            <SelectValue placeholder={`${label}: ${t("common.all")}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {label}: {t("common.all")}
            </SelectItem>
            {displayUnknown && (
              <SelectItem value={value}>
                {unknownLabel ?? t("audit.unknownActor")} ({value.slice(0, 8)}…)
              </SelectItem>
            )}
            {filtered.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
