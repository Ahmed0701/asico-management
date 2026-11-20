import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { Card } from "@/shared/ui/PageHeader"
import { useDashboardChartsQuery } from "../api/dashboard-charts.api"
import type { DashboardCharts } from "../api/dashboard-charts.types"
import { formatDashboardCount } from "../lib/formatDashboardNumber"
import ChartCard from "./charts/ChartCard"
import ColumnChart from "./charts/ColumnChart"
import PhaseStatusChart, {
  PHASE_STATUSES,
  PhaseStatusLegend,
} from "./charts/PhaseStatusChart"
import TrendLineChart from "./charts/TrendLineChart"

const localeOf = (language: string) =>
  language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"

// "Nov" / "November 2026" for YYYY-MM; "15" / "Sun 15 Nov" for YYYY-MM-DD (all in UTC: they are calendar labels).
function monthText(month: string, language: string, long: boolean): string {
  return new Intl.DateTimeFormat(localeOf(language), {
    month: long ? "long" : "short",
    year: long ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00.000Z`))
}
function dayText(day: string, language: string, long: boolean): string {
  return new Intl.DateTimeFormat(
    localeOf(language),
    long
      ? { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }
      : { day: "numeric", timeZone: "UTC" },
  ).format(new Date(`${day}T00:00:00.000Z`))
}

const EmptyNote = ({ text }: { text: string }) => (
  <p className="grid h-40 place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
    {text}
  </p>
)

function ProgressTrendCard({
  points,
}: {
  points: NonNullable<DashboardCharts["progressTrend"]>
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const first = points[0]
  const last = points[points.length - 1]
  const change =
    first && last ? Math.round((last.average - first.average) * 10) / 10 : 0
  return (
    <ChartCard
      title={t("dashboard.charts.progressTitle")}
      caption={t("dashboard.charts.progressCaption")}
      action={
        <Link
          to="/monthly-progress"
          className="text-xs font-medium text-accent hover:underline"
        >
          {t("dashboard.charts.openMonthly")}
        </Link>
      }
      table={{
        headers: [
          t("dashboard.charts.month"),
          t("dashboard.charts.average"),
          t("dashboard.charts.doneVillas"),
        ],
        rows: points.map((p) => ({
          label: monthText(p.month, lang, true),
          values: [`${p.average}%`, `${p.done} / ${p.villas}`],
        })),
      }}
    >
      {last && (
        <p className="mb-2 text-xs text-muted-foreground">
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {last.average}%
          </span>
          <span className="ms-2">
            {t("dashboard.charts.changeOverPeriod", {
              change: `${change > 0 ? "+" : ""}${change}`,
            })}
          </span>
        </p>
      )}
      <TrendLineChart
        ariaLabel={t("dashboard.charts.progressTitle")}
        points={points.map((p) => ({
          key: p.month,
          axisLabel: monthText(p.month, lang, false),
          title: monthText(p.month, lang, true),
          value: p.average,
          lines: [
            t("dashboard.charts.averageLine", { value: p.average }),
            t("dashboard.charts.doneLine", { done: p.done, villas: p.villas }),
          ],
        }))}
      />
    </ChartCard>
  )
}

function PhaseStatusCard({
  rows,
}: {
  rows: NonNullable<DashboardCharts["phaseStatus"]>
}) {
  const { t } = useTranslation()
  return (
    <ChartCard
      title={t("dashboard.charts.phaseTitle")}
      caption={t("dashboard.charts.phaseCaption")}
      legend={rows.length > 0 ? <PhaseStatusLegend rows={rows} /> : undefined}
      action={
        <Link
          to="/villas/open-works"
          className="text-xs font-medium text-accent hover:underline"
        >
          {t("dashboard.charts.openWorksLink")}
        </Link>
      }
      table={{
        headers: [
          t("dashboard.charts.phase"),
          ...PHASE_STATUSES.map(({ status }) =>
            t(`openWorks.status.${status}`),
          ),
        ],
        rows: rows.map((row) => ({
          label: row.name,
          values: PHASE_STATUSES.map(({ key }) =>
            formatDashboardCount(row[key]),
          ),
        })),
      }}
    >
      {rows.length === 0 ? (
        <EmptyNote text={t("dashboard.charts.noPhases")} />
      ) : (
        <PhaseStatusChart rows={rows} />
      )}
    </ChartCard>
  )
}

function LabourCard({
  days,
}: {
  days: NonNullable<DashboardCharts["labourByDay"]>
}) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const total = days.reduce((sum, d) => sum + d.workers, 0)
  const worked = days.filter((d) => d.workers > 0)
  const average = worked.length > 0 ? Math.round(total / worked.length) : 0
  return (
    <ChartCard
      title={t("dashboard.charts.labourTitle")}
      caption={t("dashboard.charts.labourCaption", {
        average: formatDashboardCount(average),
      })}
      action={
        <Link
          to="/daily-labour"
          className="text-xs font-medium text-accent hover:underline"
        >
          {t("dashboard.charts.labourLink")}
        </Link>
      }
      table={{
        headers: [t("dashboard.charts.day"), t("dashboard.charts.workers")],
        rows: days.map((d) => ({
          label: d.day,
          values: [formatDashboardCount(d.workers)],
        })),
      }}
    >
      {total === 0 ? (
        <EmptyNote text={t("dashboard.charts.noLabour")} />
      ) : (
        <ColumnChart
          ariaLabel={t("dashboard.charts.labourTitle")}
          tickText={(v) => formatDashboardCount(Math.round(v))}
          columns={days.map((d) => ({
            key: d.day,
            axisLabel: dayText(d.day, lang, false),
            title: dayText(d.day, lang, true),
            value: d.workers,
            valueText: t("dashboard.charts.workersLine", { count: d.workers }),
          }))}
        />
      )}
    </ChartCard>
  )
}

/** The dashboard's trends: progress over the months, where the open works stand by phase, workers and payments over time. */
export default function DashboardChartsSection() {
  const { t } = useTranslation()
  const query = useDashboardChartsQuery()
  const data = query.data

  if (query.isLoading) {
    return (
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="h-72 animate-pulse bg-muted/40">
            <span className="sr-only">{t("common.loading")}</span>
          </Card>
        ))}
      </div>
    )
  }
  if (query.isError) {
    return (
      <p
        role="alert"
        className="mt-6 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
      >
        {toApiError(query.error).message}
      </p>
    )
  }
  if (
    !data ||
    (!data.progressTrend && !data.phaseStatus && !data.labourByDay)
  ) {
    return null
  }

  return (
    <section className="mt-8" aria-labelledby="dashboard-trends">
      <div className="mb-3 flex items-center gap-2">
        <h2 id="dashboard-trends" className="text-base font-semibold">
          {t("dashboard.charts.sectionTitle")}
        </h2>
        <span
          aria-hidden
          className="h-px flex-1 bg-gradient-to-r from-border to-transparent rtl:bg-gradient-to-l"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.progressTrend && (
          <ProgressTrendCard points={data.progressTrend} />
        )}
        {data.phaseStatus && <PhaseStatusCard rows={data.phaseStatus} />}
        {data.labourByDay && <LabourCard days={data.labourByDay} />}
      </div>
    </section>
  )
}
