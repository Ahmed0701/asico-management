import type { UseFormSetError, FieldValues, Path } from "react-hook-form"
import type { ApiError } from "@/shared/api/types"

const SERVER_FIELD_ALIASES: Record<string, string> = {
  currentPassword: "current",
  newPassword: "password",
}

export function applyApiFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
): void {
  if (!error.details?.length) return
  for (const detail of error.details) {
    const field = (SERVER_FIELD_ALIASES[detail.path] ?? detail.path) as Path<T>
    setError(field, { type: "server", message: detail.message })
  }
}
