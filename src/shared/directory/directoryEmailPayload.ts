import { DIRECTORY_EMAIL_API_ENABLED } from "@/shared/config/directoryEmail"

export type WithOptionalEmail<T> = T & { email?: string | null }

export function stripDirectoryEmailFromPayload<T extends {
  email?: string | null
},>(input: T): Omit<T, "email"> | T {
  if (DIRECTORY_EMAIL_API_ENABLED) return input
  const { email: _email, ...rest } = input
  return rest
}

export function directoryEmailFromApi(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  return ""
}

/** Empty input clears email on the API (`null`). */
export function directoryEmailForApi(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}
