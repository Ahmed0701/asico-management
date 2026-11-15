import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { VARIATION_ORDER_STATUSES, type VariationOrderStatus } from "../api"

const TONE: Record<VariationOrderStatus, string> = {
  PENDING: "text-progress",
  PAID: "text-success",
}

type Props = {
  value: VariationOrderStatus
  label: string
  canEdit: boolean
  disabled?: boolean
  onChange: (next: VariationOrderStatus) => void
}

/** Pending or Paid: a dropdown for someone who may change it, plain text otherwise. */
export default function VariationOrderStatusSelect({
  value,
  label,
  canEdit,
  disabled,
  onChange,
}: Props) {
  const { t } = useTranslation()

  if (!canEdit) {
    return (
      <span className={cn("text-sm font-medium", TONE[value])}>
        {t(`variationOrders.statuses.${value}`)}
      </span>
    )
  }

  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== value) onChange(next as VariationOrderStatus)
      }}
    >
      <SelectTrigger
        aria-label={label}
        className={cn("h-8 w-28 text-xs font-medium", TONE[value])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VARIATION_ORDER_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {t(`variationOrders.statuses.${status}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
