import { useId, useState } from "react"
import { useUiDirection } from "@/shared/lib/useUiDirection"
import { ChartTooltip, useWidth, type TooltipState } from "./ChartCard"
import { slotCenter } from "./chartScale"

export type TrendPoint = {
  key: string
  axisLabel: string
  title: string
  // 0 to 100.
  value: number
  lines: string[]
}

const HEIGHT = 190
const PAD_TOP = 20
const PAD_BOTTOM = 24
const AXIS_WIDTH = 40

/**
 * A percentage over time (0 to 100): a 2px accent line with 8px markers ringed in the card colour, a soft area under it, a
 * recessive grid, the latest value labelled, and a crosshair with the month's figures on hover or focus.
 */
export default function TrendLineChart({
  points,
  ariaLabel,
}: {
  points: TrendPoint[]
  ariaLabel: string
}) {
  const rtl = useUiDirection() === "rtl"
  const gradientId = useId()
  const [ref, width] = useWidth<HTMLDivElement>()
  const [tip, setTip] = useState<TooltipState>(null)
  const [active, setActive] = useState<number | null>(null)

  const plotStart = rtl ? 12 : AXIS_WIDTH
  const plotEnd = rtl ? width - AXIS_WIDTH : width - 12
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const yOf = (value: number) => PAD_TOP + plotHeight * (1 - value / 100)
  const xs = points.map((_, i) =>
    slotCenter(i, points.length, plotStart, plotEnd, rtl),
  )
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xs[i]},${yOf(p.value)}`)
    .join(" ")
  const baseline = PAD_TOP + plotHeight
  const area =
    points.length > 0
      ? `${line} L${xs[points.length - 1]},${baseline} L${xs[0]},${baseline} Z`
      : ""
  const step = (plotEnd - plotStart) / Math.max(points.length, 1)

  const show = (index: number) => {
    const point = points[index]
    if (!point) return
    setActive(index)
    setTip({
      x: xs[index] ?? 0,
      y: yOf(point.value),
      title: point.title,
      lines: point.lines,
    })
  }
  const hide = () => {
    setActive(null)
    setTip(null)
  }

  return (
    <div ref={ref} className="relative" onMouseLeave={hide}>
      {width > 0 && (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 25, 50, 75, 100].map((value) => {
            const y = yOf(value)
            return (
              <g key={value}>
                <line
                  x1={plotStart}
                  x2={plotEnd}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={value === 0 ? undefined : "3 4"}
                />
                {value % 50 === 0 && (
                  <text
                    x={rtl ? plotEnd + 6 : plotStart - 6}
                    y={y}
                    dy="0.32em"
                    textAnchor={rtl ? "start" : "end"}
                    className="fill-muted-foreground text-[10px] tabular-nums"
                  >
                    {value}%
                  </text>
                )}
              </g>
            )
          })}
          {active !== null && (
            <line
              x1={xs[active]}
              x2={xs[active]}
              y1={PAD_TOP}
              y2={baseline}
              stroke="var(--muted-foreground)"
              strokeOpacity="0.5"
              strokeDasharray="2 3"
            />
          )}
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((point, i) => {
            const isLast = i === points.length - 1
            return (
              <g key={point.key}>
                <circle
                  cx={xs[i]}
                  cy={yOf(point.value)}
                  r={active === i ? 5.5 : 4}
                  fill="var(--accent)"
                  stroke="var(--card)"
                  strokeWidth={2}
                  className="transition-[r] duration-150"
                />
                {isLast && (
                  <text
                    x={xs[i]}
                    y={yOf(point.value) - 10}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-semibold tabular-nums"
                  >
                    {point.value}%
                  </text>
                )}
                <text
                  x={xs[i]}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {point.axisLabel}
                </text>
                <rect
                  x={(xs[i] ?? 0) - step / 2}
                  y={PAD_TOP - 10}
                  width={step}
                  height={plotHeight + 10}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${point.title}: ${point.value}%`}
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => show(i)}
                  onFocus={() => show(i)}
                  onBlur={hide}
                />
              </g>
            )
          })}
        </svg>
      )}
      <ChartTooltip tip={tip} width={width} />
    </div>
  )
}
