/** Clamps and rounds a 0–100 progress percentage for display. */
export function clampProgressPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

/** Villa overall progress label with one decimal place (bar width still uses clamped integer). */
export function formatVillaProgressLabel(value: number): string {
  const clamped = Math.min(100, Math.max(0, value))
  return `${clamped.toFixed(1)}%`
}

/** Tailwind fill class for a progress indicator (0%, 1–99%, 100%). */
export function progressIndicatorClass(value: number): string {
  const clamped = clampProgressPercent(value)
  if (clamped >= 100) return "bg-success"
  if (clamped > 0) return "bg-accent"
  return "bg-transparent"
}
