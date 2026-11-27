import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import type { StoreCategory, StoreItem, StoreMovementKind } from "../api"

const CATEGORY_TONE = {
  WIRE: "info",
  BOX: "warn",
  OTHER: "neutral",
} as const satisfies Record<StoreCategory, "info" | "warn" | "neutral">

export function StoreCategoryBadge({ category }: { category: StoreCategory }) {
  const { t } = useTranslation()
  return (
    <Badge tone={CATEGORY_TONE[category]}>
      {t(`store.categories.${category}`)}
    </Badge>
  )
}

const KIND_TONE = {
  RECEIVE: "success",
  ISSUE: "danger",
  ADJUST: "info",
  TRANSFER: "warn",
} as const satisfies Record<StoreMovementKind, "success" | "danger" | "info" | "warn">

export function StoreKindBadge({ kind }: { kind: StoreMovementKind }) {
  const { t } = useTranslation()
  return <Badge tone={KIND_TONE[kind]}>{t(`store.kinds.${kind}`)}</Badge>
}

/** Out of stock, low, or inactive; nothing for an item that is fine. */
export function StoreStockBadge({ item }: { item: StoreItem }) {
  const { t } = useTranslation()
  if (!item.active) return <Badge>{t("store.inactive")}</Badge>
  if (item.quantity === 0) return <Badge tone="danger">{t("store.out")}</Badge>
  if (item.low) return <Badge tone="warn">{t("store.low")}</Badge>
  return null
}
