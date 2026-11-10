import type { TFunction } from "i18next"

export function permissionLabel(t: TFunction, code: string): string {
  const key = `permissions.codes.${code.replace(":", "_")}`
  return t(key, { defaultValue: code })
}

export function permissionDiff(before: string[], after: string[]) {
  const beforeSet = new Set(before)
  const afterSet = new Set(after)
  const added = after.filter((c) => !beforeSet.has(c))
  const removed = before.filter((c) => !afterSet.has(c))
  return { added, removed }
}
