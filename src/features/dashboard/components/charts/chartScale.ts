/** A round top for a value axis: 1, 2 or 5 times a power of ten, at least `max` (and at least 1). */
export function niceMax(max: number): number {
  if (!Number.isFinite(max) || max <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(max))
  for (const step of [1, 2, 5, 10]) {
    if (step * power >= max) return step * power
  }
  return 10 * power
}

/**
 * The x of slot `index` of `count` slots spread over [start, end] (each slot's centre). In a right-to-left page the first
 * slot is on the right, so time reads the way the page does.
 */
export function slotCenter(
  index: number,
  count: number,
  start: number,
  end: number,
  rtl: boolean,
): number {
  const step = (end - start) / Math.max(count, 1)
  const position = rtl ? count - 1 - index : index
  return start + step * (position + 0.5)
}

/** A bar with 4px rounded top corners, square at the baseline. */
export function columnPath(
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  if (height <= 0) return ""
  const r = Math.min(4, width / 2, height)
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
    "Z",
  ].join(" ")
}
