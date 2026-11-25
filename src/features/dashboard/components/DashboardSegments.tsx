import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/shared/lib/cn"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { formatDashboardCount } from "../lib/formatDashboardNumber"
import { shareTexts } from "../lib/shareTexts"

export type DashboardSegment = {
  key: string
  label: string
  count: number
  icon: LucideIcon
  /** The colour of the part, as a background class. */
  bar: string
  /** The colours of the icon's chip. */
  chip: string
  /** The list the tile opens. */
  href?: string
}

/**
 * One whole split into parts: a bar with a part for each that has any, and a tile for each with its count and its share.
 * Draws nothing when there is nothing to split.
 */
export default function DashboardSegments({
  ariaLabel,
  segments,
}: {
  ariaLabel: string
  segments: DashboardSegment[]
}) {
  const { t } = useTranslation()
  const total = segments.reduce((sum, seg) => sum + seg.count, 0)
  if (total <= 0) return null

  const shares = shareTexts(segments.map((seg) => seg.count))
  const parts = segments.map((seg, index) => ({
    ...seg,
    share: shares[index],
  }))

  return (
    <>
      <div role="img" aria-label={ariaLabel} className="mt-2 flex gap-0.5">
        {parts
          .filter((part) => part.count > 0)
          .map((part) => (
            <Tooltip key={part.key}>
              <TooltipTrigger asChild>
                {/* Taller than the bar it holds, so it is easy to point at. */}
                <span
                  className="flex h-6 min-w-1.5 items-center"
                  style={{ flexGrow: part.count, flexBasis: 0 }}
                >
                  <span className={cn("h-2 w-full rounded-full", part.bar)} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {part.label}: {formatDashboardCount(part.count)} (
                <bdi dir="ltr">{part.share}</bdi>)
              </TooltipContent>
            </Tooltip>
          ))}
      </div>

      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {parts.map((part) => {
          const PartIcon = part.icon
          const tile = cn(
            "flex h-full min-w-0 items-center gap-3 rounded-lg border border-border px-3 py-2.5",
            part.href &&
              "transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  part.chip,
                )}
              >
                <PartIcon size={17} strokeWidth={1.9} />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    aria-hidden
                    className={cn("size-2 shrink-0 rounded-full", part.bar)}
                  />
                  <span className="min-w-0">{part.label}</span>
                </span>
                <span className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums">
                    {formatDashboardCount(part.count)}
                  </span>
                  <span
                    dir="ltr"
                    className="text-xs tabular-nums text-muted-foreground"
                  >
                    {part.share}
                  </span>
                </span>
              </span>
            </>
          )
          return (
            <li key={part.key} className="min-w-0">
              {part.href ? (
                <Link
                  to={part.href}
                  className={tile}
                  aria-label={t("dashboard.segmentLink", {
                    label: part.label,
                    count: formatDashboardCount(part.count),
                  })}
                >
                  {content}
                </Link>
              ) : (
                <div className={tile}>{content}</div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
