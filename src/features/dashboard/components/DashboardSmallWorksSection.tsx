import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { Badge } from "@/shared/ui/Badge"
import { Card } from "@/shared/ui/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { DashboardSmallWorks } from "../api/dashboard.types"
import { dashboardLinks } from "../lib/dashboardLinks"

function formatEndDate(ymd: string): string {
  return formatCalendarDateUtc(`${ymd}T00:00:00.000Z`)
}

export default function DashboardSmallWorksSection({
  smallWorks,
}: {
  smallWorks: DashboardSmallWorks
}) {
  const { t } = useTranslation()

  if (smallWorks.urgent.length === 0) return null

  return (
    <Card tone="red" className="overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="tone-label text-sm font-semibold">
          {t("dashboard.smallWorksUrgentTitle")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {t("dashboard.smallWorksUrgentCaption")}
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 py-2">
              {t("smallWorks.colVillaNumber")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("smallWorks.colDescription")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("smallWorks.colContractor")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("smallWorks.colEndDate")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("dashboard.colAlert")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {smallWorks.urgent.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-4 py-2 tabular-nums">
                <Link
                  to={dashboardLinks.villaSmallWorkHighlight(
                    row.villa.id,
                    row.id,
                  )}
                  className="font-medium hover:underline"
                >
                  {row.villa.villaNumber}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-2" dir="auto">
                {row.description}
              </TableCell>
              <TableCell className="px-4 py-2" dir="auto">
                {row.contractor.name}
              </TableCell>
              <TableCell className="px-4 py-2 tabular-nums">
                {formatEndDate(row.endDate)}
              </TableCell>
              <TableCell className="px-4 py-2">
                <Badge tone={row.alert === "overdue" ? "danger" : "warn"}>
                  {row.alert === "overdue"
                    ? t("smallWorks.badge.overdue")
                    : t("smallWorks.badge.dueSoon")}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
