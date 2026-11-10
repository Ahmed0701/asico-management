import { useTranslation } from "react-i18next"
import { Badge } from "@/shared/ui/Badge"
import { Switch } from "@/shared/ui/switch"
import type { PartyStatus } from "./party.types"

export default function DirectoryPartyStatusControls({
  status,
  disabled,
  onCheckedChange,
  name,
}: {
  status: PartyStatus
  disabled?: boolean
  onCheckedChange: (active: boolean) => void
  name: string
}) {
  const { t } = useTranslation()
  const active = status === "ACTIVE"

  return (
    <div className="flex items-center gap-2">
      <Badge tone={active ? "success" : "neutral"}>
        {t(`directory.statusLabels.${status}`)}
      </Badge>
      <Switch
        checked={active}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={
          active
            ? t("directory.deactivateParty", { name })
            : t("directory.activateParty", { name })
        }
      />
    </div>
  )
}
