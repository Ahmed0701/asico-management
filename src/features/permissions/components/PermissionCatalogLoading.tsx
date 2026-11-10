import { Skeleton } from "@/shared/ui/skeleton"
import { Card } from "@/shared/ui/PageHeader"

export function PermissionCatalogLoading({
  groups = 3,
  rows = 4,
}: {
  groups?: number
  rows?: number
}) {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: groups }).map((_, i) => (
        <Card key={i} className="overflow-hidden p-0">
          <Skeleton className="h-10 w-full rounded-none" />
          <div className="space-y-0 divide-y divide-border">
            {Array.from({ length: rows }).map((__, j) => (
              <div key={j} className="flex justify-between gap-2 px-4 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}
