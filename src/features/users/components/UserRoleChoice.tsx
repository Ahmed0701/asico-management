import { useTranslation } from "react-i18next"
import { HardHat, ShieldCheck } from "lucide-react"
import Button from "@/shared/ui/Button"
import { cn } from "@/shared/lib/cn"
import type { UserRole } from "../api"

const CHOICES: { role: UserRole; icon: typeof ShieldCheck }[] = [
  { role: "EMPLOYEE", icon: HardHat },
  { role: "ADMIN", icon: ShieldCheck },
]

/**
 * Engineer or administrator: two buttons, the chosen one pressed. An administrator has every permission and sees every
 * villa; an engineer has only the permissions it is given.
 */
export default function UserRoleChoice({
  value,
  onChange,
  disabled,
}: {
  value: UserRole
  onChange: (role: UserRole) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      role="group"
      aria-label={t("users.roleChoice.label")}
      className="grid gap-2 sm:grid-cols-2"
    >
      {CHOICES.map(({ role, icon: RoleIcon }) => {
        const chosen = value === role
        return (
          <Button
            key={role}
            type="button"
            variant="secondary"
            aria-pressed={chosen}
            disabled={disabled}
            onClick={() => onChange(role)}
            className={cn(
              "h-auto justify-start gap-3 px-3 py-2.5 text-start",
              chosen && "border-accent bg-accent/10 text-foreground",
            )}
          >
            <RoleIcon
              size={18}
              aria-hidden
              className={chosen ? "text-accent" : "text-muted-foreground"}
            />
            <span className="grid">
              <span className="text-sm font-semibold">
                {t(`roles.${role}`)}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {t(`users.roleChoice.hint.${role}`)}
              </span>
            </span>
          </Button>
        )
      })}
    </div>
  )
}
