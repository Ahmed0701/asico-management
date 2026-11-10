const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Values sent to the API for from/to. */
export function toApiDateBoundary(
  value: string,
  mode: "date" | "datetime",
): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (mode === "date") {
    return DATE_ONLY.test(trimmed) ? trimmed : undefined
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value.trim())
}

/** Local datetime-local input value → ISO with Z. */
export function datetimeLocalToIso(localValue: string): string | undefined {
  if (!localValue.trim()) return undefined
  const parsed = new Date(localValue)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

/** ISO → value for datetime-local input in local TZ. */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
