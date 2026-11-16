import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { Card } from "@/shared/ui/PageHeader"

/** The width of an element, followed as it resizes (charts draw in pixels so their text never stretches). */
export function useWidth<T extends HTMLElement,>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

export type TooltipState = {
  // Position inside the chart box, in pixels: the centre of the mark and its top.
  x: number
  y: number
  title: string
  lines: string[]
} | null

/** A small card above the hovered (or focused) mark. */
export function ChartTooltip({
  tip,
  width,
}: {
  tip: TooltipState
  width: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [boxWidth, setBoxWidth] = useState(0)
  useEffect(() => {
    if (ref.current) setBoxWidth(ref.current.offsetWidth)
  }, [tip])
  if (!tip) return null
  // Kept inside the chart: never cut at an edge.
  const left = Math.min(
    Math.max(tip.x - boxWidth / 2, 0),
    Math.max(width - boxWidth, 0),
  )
  return (
    <div
      ref={ref}
      role="status"
      className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-lg"
      style={{
        left,
        top: Math.max(tip.y - 8, 0),
        transform: "translateY(-100%)",
      }}
    >
      <p className="font-semibold text-foreground">{tip.title}</p>
      {tip.lines.map((line) => (
        <p key={line} className="text-muted-foreground tabular-nums">
          {line}
        </p>
      ))}
    </div>
  )
}

export type ChartTableRow = {
  label: string
  values: string[]
}

export type ChartTable = {
  headers: string[]
  rows: ChartTableRow[]
}

/** The frame of a dashboard chart: title, caption, an optional legend and link, the chart, and its numbers as a table
 * for screen readers. */
export default function ChartCard({
  title,
  caption,
  legend,
  action,
  table,
  children,
}: {
  title: string
  caption?: string
  legend?: ReactNode
  action?: ReactNode
  table: ChartTable
  children: ReactNode
}) {
  return (
    <Card className="flex flex-col p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {caption && (
            <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>
          )}
        </div>
        {action}
      </div>
      {legend && <div className="mb-3">{legend}</div>}
      <div className="min-w-0 flex-1">{children}</div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            {table.headers.map((header) => (
              <th key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, i) => (
                <td key={`${row.label}-${i}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
