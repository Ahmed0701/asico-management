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
import type { DashboardOpenWorks } from "../api/dashboard.types"
import { dashboardLinks } from "../lib/dashboardLinks"

function formatEndDate(ymd: string): string {
  return formatCalendarDateUtc(`${ymd}T00:00:00.000Z`)
}

export default function DashboardOverdueOpenWorksSection({
  openWorks,
}: {
  openWorks: DashboardOpenWorks
}) {
  const { t } = useTranslation()

  if (openWorks.overdueList.length === 0) return null

  return (
    <Card tone="red" className="overflow-hidden p-0">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="tone-label text-sm font-semibold">
            {t("dashboard.openWorksOverdueTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.openWorksOverdueCaption")}
          </p>
        </div>
        <Link
          to={dashboardLinks.openWorksOverdue()}
          className="text-xs text-accent hover:underline"
        >
          {t("dashboard.openWorksOverdueViewAll")}
        </Link>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 py-2">
              {t("smallWorks.colVillaNumber")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("dashboard.colPhase")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("smallWorks.colContractor")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("smallWorks.colEndDate")}
            </TableHead>
            <TableHead className="px-4 py-2">
              {t("dashboard.colLate")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {openWorks.overdueList.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="px-4 py-2 tabular-nums">
                <Link
                  to={dashboardLinks.villaOpenWorks(row.villa.id)}
                  className="font-medium hover:underline"
                >
                  {row.villa.villaNumber}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-2" dir="auto">
                {row.elecPhase.name}
              </TableCell>
              <TableCell className="px-4 py-2" dir="auto">
                {row.contractor?.name ?? "-"}
              </TableCell>
              <TableCell className="px-4 py-2 tabular-nums">
                {formatEndDate(row.endDate)}
              </TableCell>
              <TableCell className="px-4 py-2">
                <Badge tone="danger">
                  {t("openWorks.daysLate", { count: row.overdueDays })}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
