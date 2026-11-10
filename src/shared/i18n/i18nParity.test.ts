import { describe, expect, it } from "vitest"
import en from "./en.json"
import ar from "./ar.json"

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return prefix ? [prefix] : []
  const entries = Object.entries(value as Record<string, unknown>)
  const keys: string[] = []
  for (const [key, child] of entries) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      keys.push(...flattenKeys(child, path))
    } else {
      keys.push(path)
    }
  }
  return keys.sort()
}

describe("i18n en/ar parity", () => {
  it("has the same keys in English and Arabic", () => {
    expect(flattenKeys(ar)).toEqual(flattenKeys(en))
  })
})
