import { useTranslation } from "react-i18next"
import { Card } from "@/shared/ui/PageHeader"
import type { PermissionGroup } from "../api"
import { permissionLabel } from "../lib/permissionLabel"

export function PermissionCatalogCards({
  catalog,
}: {
  catalog: PermissionGroup[]
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      {catalog.map((group) => (
        <Card key={group.resource} className="overflow-hidden">
          <div className="border-b border-border bg-muted/40 px-4 py-2.5">
            <h2 className="text-sm font-semibold">
              {t(`permissions.resources.${group.resource}`, {
                defaultValue: group.resource,
              })}
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {group.permissions.map((code) => (
              <li
                key={code}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>{permissionLabel(t, code)}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {code}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}
