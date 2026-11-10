import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"
import type { PermissionGroup } from "../api"
import { permissionLabel } from "../lib/permissionLabel"

function permControlId(code: string): string {
  return `perm-${code.replace(/:/g, "-")}`
}

export function PermissionAssignGroups({
  catalog,
  selected,
  onToggle,
  onToggleGroup,
  readOnly = false,
  variant = "editor",
}: {
  catalog: PermissionGroup[]
  selected: string[]
  onToggle: (code: string) => void
  onToggleGroup?: (codes: string[], enable: boolean) => void
  readOnly?: boolean
  variant?: "editor" | "compact"
}) {
  const { t } = useTranslation()
  const selectedSet = new Set(selected)

  return (
    <div className={variant === "compact" ? "space-y-3" : "space-y-4"}>
      {catalog.map((group) => {
        const allSelected = group.permissions.every((c) => selectedSet.has(c))
        const showGroupActions =
          !readOnly && onToggleGroup && variant === "editor"

        return (
          <div
            key={group.resource}
            className={
              variant === "compact"
                ? undefined
                : "rounded-lg border border-border p-3"
            }
          >
            <div
              className={
                variant === "compact"
                  ? "mb-1"
                  : "mb-2 flex items-center justify-between gap-2"
              }
            >
              <p
                className={
                  variant === "compact"
                    ? "text-xs font-medium uppercase text-muted-foreground"
                    : "text-sm font-medium"
                }
              >
                {t(`permissions.resources.${group.resource}`, {
                  defaultValue: group.resource,
                })}
              </p>
              {showGroupActions && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleGroup(group.permissions, !allSelected)}
                >
                  {allSelected
                    ? t("permissions.clearGroup")
                    : t("permissions.selectAllGroup")}
                </Button>
              )}
            </div>
            <ul
              className={
                variant === "compact"
                  ? "space-y-1"
                  : "divide-y divide-border rounded-md border border-border"
              }
            >
              {group.permissions.map((code) => {
                const id = permControlId(code)
                const checked = selectedSet.has(code)
                return (
                  <li key={code}>
                    <div
                      className={
                        variant === "compact"
                          ? "flex items-center gap-2"
                          : `flex items-center gap-3 px-3 py-2 text-sm ${
                              readOnly ? "opacity-70" : "hover:bg-muted/50"
                            }`
                      }
                    >
                      <Checkbox
                        id={id}
                        disabled={readOnly}
                        checked={checked}
                        onCheckedChange={() => onToggle(code)}
                      />
                      <Label
                        htmlFor={id}
                        className={`flex flex-1 items-center gap-2 font-normal ${
                          readOnly ? "" : "cursor-pointer"
                        } ${variant === "compact" ? "text-sm" : ""}`}
                      >
                        <span className="flex-1">
                          {permissionLabel(t, code)}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {code}
                        </span>
                      </Label>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
