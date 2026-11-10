export const REDACTED = "[REDACTED]"

export type DiffChange = { kind: "created" } | { kind: "removed" } | {
  kind: "none"
} | {
  kind: "scalar"
  path: string
  before: unknown
  after: unknown
} | {
  kind: "stringArray"
  path: string
  added: string[]
  removed: string[]
} | {
  kind: "nested"
  path: string
  changes: DiffChange[]
}

export function isRedacted(value: unknown): boolean {
  return value === REDACTED
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isStringArray(a: unknown): a is string[] {
  return Array.isArray(a) && a.every((x) => typeof x === "string")
}

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function diffValues(
  path: string,
  before: unknown,
  after: unknown,
): DiffChange[] {
  if (jsonEqual(before, after)) return []

  if (isStringArray(before) && isStringArray(after)) {
    const beforeSet = new Set(before)
    const afterSet = new Set(after)
    const added = after.filter((x) => !beforeSet.has(x))
    const removed = before.filter((x) => !afterSet.has(x))
    if (added.length === 0 && removed.length === 0) return []
    return [{ kind: "stringArray", path, added, removed }]
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    const nested: DiffChange[] = []
    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key
      const b = key in before ? before[key] : undefined
      const a = key in after ? after[key] : undefined
      if (b === undefined && a !== undefined) {
        nested.push({
          kind: "scalar",
          path: childPath,
          before: undefined,
          after: a,
        })
      } else if (a === undefined && b !== undefined) {
        nested.push({
          kind: "scalar",
          path: childPath,
          before: b,
          after: undefined,
        })
      } else {
        nested.push(...diffValues(childPath, b, a))
      }
    }
    if (nested.length === 0) return []
    return [{ kind: "nested", path, changes: nested }]
  }

  return [{ kind: "scalar", path, before, after }]
}

export function diffAuditSnapshots(
  before: unknown,
  after: unknown,
): DiffChange[] {
  if (before === null && after === null) return [{ kind: "none" }]
  if (before === null && after !== null) return [{ kind: "created" }]
  if (before !== null && after === null) return [{ kind: "removed" }]
  return diffValues("", before, after)
}

export function flattenVisibleChanges(changes: DiffChange[]): DiffChange[] {
  const out: DiffChange[] = []
  for (const c of changes) {
    if (c.kind === "nested") {
      out.push(...flattenVisibleChanges(c.changes))
    } else if (c.kind !== "none") {
      out.push(c)
    }
  }
  return out
}

export function formatDiffValue(value: unknown): string {
  if (value === undefined) return "-"
  if (value === null) return "null"
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean")
    return String(value)
  return JSON.stringify(value)
}
