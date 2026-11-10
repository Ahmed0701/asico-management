import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import type { UseQueryResult } from "@tanstack/react-query"
import { toApiError } from "@/shared/api/errors"
import Button from "@/shared/ui/Button"
import { Card } from "@/shared/ui/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import Icon from "@/shared/ui/Icon"
import { Badge } from "@/shared/ui/Badge"
import { DashboardSkeleton } from "@/shared/ui/loading-skeletons"
import {
  dashboardHasAnySection,
  type DashboardSummary,
} from "../api/dashboard.types"
import { dashboardLinks } from "../lib/dashboardLinks"
import { formatDashboardCount } from "../lib/formatDashboardNumber"
import DashboardLinkCard from "./DashboardLinkCard"
import DashboardPairSplit from "./DashboardPairSplit"
import DashboardProgressBreakdown from "./DashboardProgressBreakdown"
import DashboardStatusBreakdown from "./DashboardStatusBreakdown"
import DashboardUtcHint from "./DashboardUtcHint"
import DashboardSmallWorksSection from "./DashboardSmallWorksSection"
import DashboardOverdueOpenWorksSection from "./DashboardOverdueOpenWorksSection"

export default function DashboardSummarySection({
  query,
  canVillasRead,
  canContractorsRead,
}: {
  query: UseQueryResult<DashboardSummary, Error>
  canVillasRead: boolean
  canContractorsRead: boolean
}) {
  const { t } = useTranslation()
  const { data, isLoading, isError, error, refetch, isFetching } = query

  if (isLoading && !data) {
    return <DashboardSkeleton />
  }

  if (isError) {
    const apiErr = toApiError(error)
    if (apiErr.status === 403) {
      return (
        <Card className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 p-10 text-center">
          <span className="grid size-10 place-items-center rounded-full bg-muted">
            <Icon name="shield" />
          </span>
          <h2 className="text-lg font-semibold">
            {t("dashboard.forbiddenTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.forbiddenBody")}
          </p>
        </Card>
      )
    }
    return (
      <Card className="p-6">
        <p className="text-sm text-danger">{apiErr.message}</p>
        <Button className="mt-3" type="button" onClick={() => void refetch()}>
          {t("common.retry")}
        </Button>
      </Card>
    )
  }

  if (!data) return null

  if (!dashboardHasAnySection(data)) {
    return (
      <Card className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted">
          <Icon name="dashboard" />
        </span>
        <h2 className="text-lg font-semibold">
          {t("dashboard.allHiddenTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.allHiddenBody")}
        </p>
      </Card>
    )
  }

  // Done open works leave the dashboard (they are on the Done Works page): only the ones still to finish are shown.
  const openWorkSegments = data.openWorks
    ? ([
        ["NOT_STARTED", "bg-muted-foreground/40"],
        ["IN_PROGRESS", "bg-open"],
        ["DELAYED", "bg-accent"],
      ] as const).map(([status, tone]) => ({
        key: status,
        label: t(`openWorks.status.${status}`),
        count: data.openWorks!.byStatus[status],
        tone,
        href: dashboardLinks.openWorksStatus(status),
      }))
    : []

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.villas && (
          <DashboardLinkCard
            to={dashboardLinks.villas()}
            label={t("dashboard.villasTotal")}
            tone="blue"
            icon="dashboard"
            value={formatDashboardCount(data.villas.total)}
          />
        )}
        {data.openWorks && (
          <DashboardLinkCard
            to={dashboardLinks.openWorksTotal()}
            label={t("dashboard.openWorksTotal")}
            tone="teal"
            icon="pipe"
            value={formatDashboardCount(
              data.openWorks.total - data.openWorks.byStatus.DONE,
            )}
          />
        )}
        {data.openWorks && (
          <DashboardLinkCard
            to={dashboardLinks.openWorksOverdue()}
            label={t("dashboard.openWorksOverdueCard")}
            tone="red"
            icon="alert"
            value={formatDashboardCount(data.openWorks.overdue)}
            help={t("dashboard.openWorksOverdueHelp")}
            valueClassName={
              data.openWorks.overdue > 0 ? "text-danger" : undefined
            }
            labelExtra={
              data.openWorks.overdue > 0 ? (
                <span
                  aria-hidden
                  className="ms-2 inline-block size-2 animate-pulse rounded-full bg-danger"
                />
              ) : undefined
            }
          />
        )}
        {data.smallWorks && (
          <DashboardLinkCard
            to={dashboardLinks.smallWorksTotal()}
            label={t("dashboard.smallWorksTotal")}
            tone="purple"
            icon="ruler"
            value={formatDashboardCount(data.smallWorks.total)}
          />
        )}
        {data.delayedSmallWorks && (
          <Card tone="red" className="flex h-full flex-col p-4">
            <p className="tone-label text-xs font-medium text-muted-foreground">
              {t("dashboard.delayedSmallWorksTitle")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link
                to={dashboardLinks.smallWorksOverdue()}
                className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  className={
                    data.delayedSmallWorks.overdue > 0
                      ? "text-3xl font-semibold tabular-nums tracking-tight text-danger"
                      : "text-3xl font-semibold tabular-nums tracking-tight"
                  }
                >
                  {formatDashboardCount(data.delayedSmallWorks.overdue)}
                </span>
                <Badge tone="danger">{t("smallWorks.badge.overdue")}</Badge>
              </Link>
              {data.delayedSmallWorks.dueSoon > 0 && (
                <Link
                  to={dashboardLinks.smallWorksDueSoon()}
                  className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="text-xl font-semibold tabular-nums tracking-tight text-accent">
                    {formatDashboardCount(data.delayedSmallWorks.dueSoon)}
                  </span>
                  <Badge tone="warn">{t("smallWorks.badge.dueSoon")}</Badge>
                </Link>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("dashboard.delayedSmallWorksCaption")}
            </p>
          </Card>
        )}
        {data.totalLabour && (
          <DashboardLinkCard
            to={dashboardLinks.dailyReports()}
            label={t("dashboard.totalLabourTitle")}
            tone="orange"
            icon="hardhat"
            value={formatDashboardCount(data.totalLabour.total)}
            help={t("dashboard.totalLabourCaption")}
          />
        )}
        {data.mewFollowUp && (
          <DashboardLinkCard
            to={dashboardLinks.mewFollowUp()}
            label={t("dashboard.mewFollowUp")}
            tone="green"
            icon="bell"
            value={formatDashboardCount(data.mewFollowUp.count)}
            help={t("dashboard.mewFollowUpHelp")}
          />
        )}
        {data.mewInspection && (
          <DashboardLinkCard
            to={dashboardLinks.mewInspection()}
            label={t("dashboard.mewInspection")}
            tone="teal"
            icon="check"
            value={formatDashboardCount(data.mewInspection.count)}
            help={t("dashboard.mewInspectionHelp")}
          />
        )}
        {data.maintenance && (
          <DashboardLinkCard
            to={dashboardLinks.maintenance()}
            label={t("dashboard.maintenance")}
            tone="red"
            icon="alert"
            value={formatDashboardCount(data.maintenance.open)}
            help={t("dashboard.maintenanceHelp", {
              solved: formatDashboardCount(data.maintenance.solved),
            })}
          />
        )}
      </div>

      {data.progress && (
        <Card className="p-4">
          <DashboardProgressBreakdown progress={data.progress} />
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {data.dailyReports && (
          <Card tone="indigo" className="p-4">
            <DashboardPairSplit
              heading={t("dashboard.dailyReportsTitle")}
              leftLabel={t("dashboard.todayUtc")}
              rightLabel={t("dashboard.last7DaysUtc")}
              left={data.dailyReports.today}
              right={data.dailyReports.last7Days}
              leftClass="bg-accent"
              rightClass="bg-open"
              headingExtra={<DashboardUtcHint />}
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link
                to={dashboardLinks.dailyReportsToday()}
                className="text-accent hover:underline"
              >
                {t("dashboard.viewTodayList")}
              </Link>
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
              <Link
                to={dashboardLinks.dailyReportsLast7()}
                className="text-accent hover:underline"
              >
                {t("dashboard.viewLast7List")}
              </Link>
            </div>
          </Card>
        )}
        {data.labour && (
          <Card tone="orange" className="p-4">
            <DashboardPairSplit
              heading={t("dashboard.labourTitle")}
              leftLabel={t("dashboard.todayUtc")}
              rightLabel={t("dashboard.last7DaysUtc")}
              left={data.labour.today}
              right={data.labour.last7Days}
              leftClass="bg-accent"
              rightClass="bg-open"
              headingExtra={<DashboardUtcHint />}
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Link
                to={dashboardLinks.labourToday()}
                className="text-accent hover:underline"
              >
                {t("dashboard.viewTodayList")}
              </Link>
              <span className="text-muted-foreground" aria-hidden>
                ·
              </span>
              <Link
                to={dashboardLinks.labourLast7()}
                className="text-accent hover:underline"
              >
                {t("dashboard.viewLast7List")}
              </Link>
            </div>
          </Card>
        )}
      </div>

      {data.smallWorks &&
        (data.smallWorks.dueSoon > 0 || data.smallWorks.overdue > 0) && (
          <Card tone="red" className="p-4">
            <h2 className="tone-label text-sm font-semibold">
              {t("dashboard.smallWorksAlertsTitle")}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.smallWorksAlertsCaption")}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {data.smallWorks.dueSoon > 0 && (
                <Link
                  to={dashboardLinks.smallWorksDueSoon()}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <Badge tone="warn">{t("smallWorks.badge.dueSoon")}</Badge>
                  <span className="tabular-nums text-accent">
                    {formatDashboardCount(data.smallWorks.dueSoon)}
                  </span>
                </Link>
              )}
              {data.smallWorks.overdue > 0 && (
                <Link
                  to={dashboardLinks.smallWorksOverdue()}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <Badge tone="danger">{t("smallWorks.badge.overdue")}</Badge>
                  <span className="tabular-nums text-danger">
                    {formatDashboardCount(data.smallWorks.overdue)}
                  </span>
                </Link>
              )}
            </div>
          </Card>
        )}

      {data.smallWorks && (
        <DashboardSmallWorksSection smallWorks={data.smallWorks} />
      )}

      {data.openWorks && (
        <DashboardOverdueOpenWorksSection openWorks={data.openWorks} />
      )}

      {data.openWorks && (
        <Card className="p-4">
          <DashboardStatusBreakdown
            heading={t("dashboard.openWorksTitle")}
            segments={openWorkSegments}
            emptyKey="dashboard.noOpenWorks"
          />
          <p className="mt-3 text-xs">
            <Link
              to={dashboardLinks.openWorksOverdue()}
              className="text-accent hover:underline"
            >
              {t("dashboard.openWorksOverdueLink", {
                count: formatDashboardCount(data.openWorks.overdue),
              })}
            </Link>
          </p>
        </Card>
      )}

      {data.byArea && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">
              {t("dashboard.topAreasTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.topAreasCaption")}
            </p>
          </div>
          {data.byArea.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.topAreasEmpty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-2">
                    {t("villas.area")}
                  </TableHead>
                  <TableHead className="px-4 py-2">
                    {t("villas.areaCity")}
                  </TableHead>
                  <TableHead className="px-4 py-2 text-end tabular-nums">
                    {t("dashboard.colTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byArea.map((row) => (
                  <TableRow key={row.areaId}>
                    <TableCell className="px-4 py-2" dir="auto">
                      {canVillasRead ? (
                        <Link
                          to={`/villas?area=${encodeURIComponent(row.area)}`}
                          className="font-medium hover:underline"
                        >
                          {row.area}
                        </Link>
                      ) : (
                        row.area
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2" dir="auto">
                      {row.city}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-end tabular-nums">
                      {formatDashboardCount(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {data.topContractors && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">
              {t("dashboard.topContractorsTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.topContractorsCaption")}
            </p>
          </div>
          {data.topContractors.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t("dashboard.topContractorsEmpty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-2">
                    {t("fields.contractor")}
                  </TableHead>
                  <TableHead className="px-4 py-2 text-end tabular-nums">
                    {t("dashboard.colTotal")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topContractors.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 py-2" dir="auto">
                      {canContractorsRead ? (
                        <Link
                          to={`/contractors/${row.id}/summary`}
                          className="font-medium hover:underline"
                        >
                          {row.name}
                        </Link>
                      ) : (
                        row.name
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-end tabular-nums">
                      {formatDashboardCount(row.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
