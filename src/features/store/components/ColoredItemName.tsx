import type { CSSProperties } from "react"
import { cn } from "@/shared/lib/cn"
import { itemColors } from "../lib/itemColor"

/**
 * An item's name, in the color the name mentions ("Cable 4mm Red" is red). Two colors ("Yellow Green") make a gradient.
 * Black and white would vanish on one of the themes, so they keep the usual text color with a dot of the color beside it.
 * A wire's factory follows the name, in grey ("Cable 4mm Red · KWT Wires").
 */
export default function ColoredItemName({
  name,
  factory,
  className,
}: {
  name: string
  factory?: string | null
  className?: string
}) {
  const colors = itemColors(name)
  const readable = colors.filter((color) => !color.swatchOnly)
  const swatches = colors.filter((color) => color.swatchOnly)

  let style: CSSProperties | undefined
  if (readable.length === 1) {
    style = { color: readable[0]!.css }
  } else if (readable.length > 1) {
    style = {
      backgroundImage: `linear-gradient(90deg, ${readable.map((color) => color.css).join(", ")})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {swatches.map((color) => (
        <span
          key={color.key}
          aria-hidden
          data-testid={`item-swatch-${color.key}`}
          className="size-2.5 shrink-0 rounded-full ring-1 ring-border"
          style={{ backgroundColor: color.css }}
        />
      ))}
      <span
        dir="auto"
        style={style}
        data-color={colors.map((c) => c.key).join(" ") || undefined}
      >
        {name}
      </span>
      {factory && (
        <span className="text-xs text-muted-foreground" dir="auto">
          {" · "}
          {factory}
        </span>
      )}
    </span>
  )
}
