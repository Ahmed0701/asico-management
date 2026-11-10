import type { TFunction } from "i18next"
import type { ApiError } from "@/shared/api/types"

export function resolveAuthErrorMessage(t: TFunction, error: ApiError): string {
  if (error.code === "NETWORK_ERROR") {
    if (error.status === 401) return t("auth.invalidCredentials")
    if (error.status === 403) return t("auth.accountInactive")
  }
  if (error.message.includes("status code 401"))
    return t("auth.invalidCredentials")
  if (error.message.includes("status code 403"))
    return t("auth.accountInactive")
  switch (error.code) {
    case "ACCOUNT_INACTIVE":
      return t("auth.accountInactive")
    case "INVALID_CREDENTIALS":
      return t("auth.invalidCredentials")
    case "EMAIL_TAKEN":
      return t("auth.emailTaken")
    case "INVALID_RESET_TOKEN":
      return t("auth.invalidResetToken")
    case "INVALID_CURRENT_PASSWORD":
      return error.message
    default:
      return error.message
  }
}
