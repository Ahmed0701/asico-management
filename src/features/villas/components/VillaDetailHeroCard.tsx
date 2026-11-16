import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  HardHat,
  Phone,
  UserCog,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import {
  formatBudgetDisplay,
  type VillaDetail,
  type VillaMarkDto,
} from "../api"
import { buildVillaContextLine, daysUntil } from "../lib/villaDetailDisplay"
import { cn } from "@/shared/lib/cn"
import { formatDateTime } from "@/shared/lib/format"
import { formatCalendarDateUtc } from "@/shared/lib/formatCalendarDateUtc"
import { clampProgressPercent } from "@/shared/lib/progressDisplay"
import { Badge } from "@/shared/ui/Badge"
import Button, { IconButton } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/PageHeader"

type VillaDetailHeroCardProps = {
  villa: VillaDetail
  canUpdate: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
  canMewFollowUp: boolean
  mewFollowUpPending: boolean
  onToggleMewFollowUp: () => void
}

const dateText = (day: string | null) =>
  day ? formatCalendarDateUtc(`${day}T00:00:00.000Z`) : "-"

// The villa's overall progress as a ring: the share done in the accent, the rest on the track.
type ProgressRingProps = {
  value: number
  caption: string
}

function ProgressRing({ value, caption }: ProgressRingProps) {
  const size = 112
  const stroke = 10
  const radius = (size - stroke) / 2
  const length = 2 * Math.PI * radius
  const percent = clampProgressPercent(value)
  return (
    <div className="relative grid size-28 shrink-0 place-items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={`${percent}%`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--progress-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={percent >= 100 ? "var(--success)" : "var(--accent)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - percent / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {percent}
            <span className="text-sm font-semibold text-muted-foreground">
              %
            </span>
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {caption}
          </p>
        </div>
      </div>
    </div>
  )
}

// A small fact: an icon tile, its label, its value, and an optional line under it (a phone to call).
function Fact({
  icon: FactIcon,
  label,
  children,
  sub,
}: {
  icon: LucideIcon
  label: string
  children: ReactNode
  sub?: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <FactIcon size={15} strokeWidth={1.9} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="truncate text-sm font-medium">{children}</div>
        {sub}
      </div>
    </div>
  )
}

type PhoneLinkProps = {
  name: string
  phone: string
}

function PhoneLink({ name, phone }: PhoneLinkProps) {
  const { t } = useTranslation()
  if (!phone) return null
  return (
    <a
      href={`tel:${phone}`}
      className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent tabular-nums hover:underline"
      aria-label={t("villas.hero.call", { name, phone })}
      dir="ltr"
    >
      <Phone size={11} aria-hidden />
      {phone}
    </a>
  )
}

// One MEW step as a chip: done (green, with when) or still to come (muted).
type MewChipProps = {
  label: string
  mark: VillaMarkDto | null
}

function MewChip({ label, mark }: MewChipProps) {
  return (
    <span
      title={mark ? formatDateTime(mark.at) : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        mark
          ? "bg-success-soft text-success ring-success/20"
          : "bg-muted text-muted-foreground ring-border",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          mark ? "bg-success" : "bg-muted-foreground/50",
        )}
      />
      {label}
    </span>
  )
}

/** The top of the villa page: who and where, the overall progress, the MEW steps and the target, and the key facts. */
export default function VillaDetailHeroCard({
  villa,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  canMewFollowUp,
  mewFollowUpPending,
  onToggleMewFollowUp,
}: VillaDetailHeroCardProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  const blockPlotLine =
    villa.block && villa.plot
      ? t("villas.blockPlotLine", { block: villa.block, plot: villa.plot })
      : null
  const contextLine = buildVillaContextLine(villa, blockPlotLine)
  const phasesDone = villa.phases.filter(
    (phase) => phase.state === "DONE",
  ).length
  const left = villa.targetDate ? daysUntil(villa.targetDate) : null
  const done = villa.progress >= 100

  return (
    <Card className="relative mb-4 overflow-hidden p-0">
      {/* A soft glow of the accent behind the villa number, like the sidebar's. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-10%] size-72 rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground shadow-md shadow-accent/30">
              <Building2 size={26} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight tabular-nums">
                  {villa.villaNumber}
                </h1>
                {villa.villaType && (
                  <Badge
                    tone={
                      villa.villaType === "ACICO_SYSTEM" ? "info" : "neutral"
                    }
                  >
                    {t(`villas.villaTypes.${villa.villaType}`)}
                  </Badge>
                )}
              </div>
              {contextLine && (
                <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                  {contextLine}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground" dir="auto">
                {villa.location}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {canMewFollowUp && (
              <Button
                size="sm"
                variant={villa.mewFollowUp ? "secondary" : "primary"}
                icon={villa.mewFollowUp ? "x" : "plus"}
                aria-pressed={!!villa.mewFollowUp}
                disabled={mewFollowUpPending}
                onClick={onToggleMewFollowUp}
              >
                {t(
                  villa.mewFollowUp ? "mewFollowUp.remove" : "mewFollowUp.add",
                )}
              </Button>
            )}
            {canUpdate && (
              <IconButton
                icon="edit"
                label={t("common.edit")}
                onClick={onEdit}
              />
            )}
            {canDelete && (
              <IconButton
                icon="trash"
                label={t("common.delete")}
                variant="danger"
                onClick={onDelete}
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProgressRing
            value={villa.progress}
            caption={t("villas.hero.overall")}
          />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm">
              <span className="font-semibold">
                {t("villas.hero.phasesDone", {
                  done: phasesDone,
                  total: villa.phases.length,
                })}
              </span>
              {done && (
                <span className="ms-2 text-success">
                  {t("villas.hero.complete")}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <MewChip
                label={t("villas.hero.mewFollowUp")}
                mark={villa.mewFollowUp}
              />
              <MewChip
                label={t("villas.hero.mewInspection")}
                mark={villa.mewInspection}
              />
              <MewChip
                label={t("villas.hero.mewPassed")}
                mark={villa.mewInspectionPassed}
              />
            </div>
            {left !== null && !done && (
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
                  left < 0
                    ? "bg-danger-soft text-danger"
                    : left <= 14
                      ? "bg-progress-soft text-progress"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <CalendarClock size={13} aria-hidden />
                {left < 0
                  ? t("villas.hero.overdueBy", { count: -left })
                  : left === 0
                    ? t("villas.hero.dueToday")
                    : t("villas.hero.daysLeft", { count: left })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative grid gap-2.5 border-t border-border/70 bg-muted/30 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        <Fact
          icon={HardHat}
          label={t("villas.contractor")}
          sub={
            villa.contractor && (
              <PhoneLink
                name={villa.contractor.name}
                phone={villa.contractor.phone}
              />
            )
          }
        >
          <span dir="auto">{villa.contractor?.name ?? "-"}</span>
        </Fact>
        <Fact
          icon={UserCog}
          label={t("villas.electricalEngineer")}
          sub={
            villa.electricalEngineer && (
              <PhoneLink
                name={villa.electricalEngineer.name}
                phone={villa.electricalEngineer.phone}
              />
            )
          }
        >
          <span dir="auto">{villa.electricalEngineer?.name ?? "-"}</span>
        </Fact>
        <Fact
          icon={Wrench}
          label={t("villas.civilEngineer")}
          sub={
            <PhoneLink
              name={villa.civilEngineer.name}
              phone={villa.civilEngineer.phone}
            />
          }
        >
          <span dir="auto">{villa.civilEngineer.name}</span>
        </Fact>
        <Fact icon={CalendarCheck} label={t("villas.startDate")}>
          <span className="tabular-nums">{dateText(villa.startDate)}</span>
        </Fact>
        <Fact icon={CalendarClock} label={t("villas.targetDate")}>
          <span className="tabular-nums">{dateText(villa.targetDate)}</span>
        </Fact>
        <Fact icon={Wallet} label={t("villas.budgetMajor")}>
          <span className="tabular-nums" dir="ltr">
            {formatBudgetDisplay(villa.budgetMinor, villa.currency, locale)}
          </span>
        </Fact>
      </div>
    </Card>
  )
}
