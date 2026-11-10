import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { permissionLabel } from "@/features/permissions/lib/permissionLabel"
import Icon from "@/shared/ui/Icon"

function groupByResource(
  codes: string[],
): {
  resource: string
  codes: string[]
}[] {
  const map = new Map<string, string[]>()
  for (const code of codes) {
    const resource = code.split(":")[0] ?? code
    const list = map.get(resource) ?? []
    list.push(code)
    map.set(resource, list)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([resource, resourceCodes]) => ({
      resource,
      codes: [...resourceCodes].sort(),
    }))
}

export default function ProfilePermissionsList({
  permissions,
}: {
  permissions: string[]
}) {
  const { t } = useTranslation()
  const groups = useMemo(() => groupByResource(permissions), [permissions])

  if (permissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("auth.profileNoPermissions")}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {t("auth.profilePermissionsCount", { count: permissions.length })}
      </p>
      {groups.map(({ resource, codes }) => (
        <section
          key={resource}
          className="rounded-lg border border-border bg-muted/20"
          aria-labelledby={`profile-perm-${resource}`}
        >
          <h3
            id={`profile-perm-${resource}`}
            className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {t(`permissions.resources.${resource}`, { defaultValue: resource })}
          </h3>
          <ul className="divide-y divide-border">
            {codes.map((code) => (
              <li
                key={code}
                className="flex items-start gap-2 px-3 py-2 text-sm"
              >
                <Icon
                  name="check"
                  size={16}
                  className="mt-0.5 shrink-0 text-closed"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-normal">
                    {permissionLabel(t, code)}
                  </span>
                  <span
                    dir="ltr"
                    className="mt-0.5 block font-mono text-[10px] text-muted-foreground"
                  >
                    {code}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
