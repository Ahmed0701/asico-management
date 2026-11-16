import { useState } from "react"
import { useUiDirection } from "@/shared/lib/useUiDirection"
import { ChartTooltip, useWidth, type TooltipState } from "./ChartCard"
import { columnPath, niceMax, slotCenter } from "./chartScale"

export type Column = {
  key: string
  // Under the bar (short), and in the tooltip.
  axisLabel: string
  title: string
  value: number
  // The value as text ("1,250.000 KWD", "34").
  valueText: string
}

const HEIGHT = 190
const PAD_TOP = 18
const PAD_BOTTOM = 24
const AXIS_WIDTH = 44

/**
 * Vertical bars of one series over time: one colour (the accent), thin 4px-rounded bars anchored on the baseline with a
 * gap between them, a recessive grid, the highest and the latest values labelled, every bar's value on hover or focus.
 */
export default function ColumnChart({
  columns,
  ariaLabel,
  tickText,
}: {
  columns: Column[]
  ariaLabel: string
  tickText: (value: number) => string
}) {
  const rtl = useUiDirection() === "rtl"
  const [ref, width] = useWidth<HTMLDivElement>()
  const [tip, setTip] = useState<TooltipState>(null)
  const [active, setActive] = useState<string | null>(null)

  const top = niceMax(Math.max(...columns.map((c) => c.value), 0))
  const plotStart = rtl ? 8 : AXIS_WIDTH
  const plotEnd = rtl ? width - AXIS_WIDTH : width - 8
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  const step = (plotEnd - plotStart) / Math.max(columns.length, 1)
  const barWidth = Math.max(Math.min(step - 4, 36), 3)
  const yOf = (value: number) => PAD_TOP + plotHeight * (1 - value / top)
  const maxIndex = columns.reduce(
    (best, c, i) => (c.value > (columns[best]?.value ?? 0) ? i : best),
    0,
  )
  // Every other axis label when the bars are narrow.
  const labelEvery = step < 34 ? 2 : 1

  const show = (column: Column, index: number) => {
    const x = slotCenter(index, columns.length, plotStart, plotEnd, rtl)
    setActive(column.key)
    setTip({
      x,
      y: yOf(column.value),
      title: column.title,
      lines: [column.valueText],
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
          {[0, 0.5, 1].map((share) => {
            const y = yOf(top * share)
            return (
              <g key={share}>
                <line
                  x1={plotStart}
                  x2={plotEnd}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={share === 0 ? undefined : "3 4"}
                />
                <text
                  x={rtl ? plotEnd + 6 : plotStart - 6}
                  y={y}
                  dy="0.32em"
                  textAnchor={rtl ? "start" : "end"}
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {tickText(top * share)}
                </text>
              </g>
            )
          })}
          {columns.map((column, index) => {
            const cx = slotCenter(
              index,
              columns.length,
              plotStart,
              plotEnd,
              rtl,
            )
            const y = yOf(column.value)
            const isLast = index === columns.length - 1
            const labelled = column.value > 0 && (isLast || index === maxIndex)
            return (
              <g key={column.key}>
                <path
                  d={columnPath(
                    cx - barWidth / 2,
                    y,
                    barWidth,
                    PAD_TOP + plotHeight - y,
                  )}
                  fill="var(--accent)"
                  opacity={active === null || active === column.key ? 1 : 0.45}
                  className="transition-opacity duration-150"
                />
                {labelled && (
                  <text
                    x={cx}
                    y={y - 5}
                    textAnchor="middle"
                    className="fill-foreground text-[10px] font-semibold tabular-nums"
                  >
                    {tickText(column.value)}
                  </text>
                )}
                {index % labelEvery === (columns.length - 1) % labelEvery && (
                  <text
                    x={cx}
                    y={HEIGHT - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {column.axisLabel}
                  </text>
                )}
                {/* The hit target: the whole column, wider than the bar. */}
                <rect
                  x={cx - step / 2}
                  y={PAD_TOP}
                  width={step}
                  height={plotHeight}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${column.title}: ${column.valueText}`}
                  className="cursor-pointer outline-none focus-visible:stroke-accent"
                  onMouseEnter={() => show(column, index)}
                  onFocus={() => show(column, index)}
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
