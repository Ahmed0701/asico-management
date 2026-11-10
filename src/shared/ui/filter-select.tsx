import { useTranslation } from "react-i18next"
import { cn } from "./utils"
import { Label } from "./label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"

const ALL = "__all__"

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
  triggerClassName,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: {
    value: string
    label: string
  }[]
  className?: string
  triggerClassName?: string
}) {
  const { t } = useTranslation()
  const selectValue = value || ALL

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === ALL ? "" : v)}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            "h-9 w-auto min-w-32 max-w-44 bg-card",
            triggerClassName,
          )}
          aria-label={label}
        >
          <SelectValue placeholder={t("common.all")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("common.all")}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function PageSizeSelect({
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
}: {
  value: number
  onChange: (n: number) => void
  options: readonly number[]
  "aria-label": string
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger size="sm" className="h-7 w-18 bg-card px-2">
        <SelectValue aria-label={ariaLabel} />
      </SelectTrigger>
      <SelectContent>
        {options.map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
