import type { TFunction } from "i18next"
import type { ApiError } from "../types"
import { isIdempotencyRotateCode } from "./errors"

export function resolveWriteSafetyClientMessage(
  t: TFunction,
  error: ApiError,
): string {
  if (
    isIdempotencyRotateCode(error.code) ||
    error.code === "INVALID_IF_MATCH"
  ) {
    return t("writeSafety.clientBug", {
      requestId: error.requestId ?? "",
    })
  }
  return error.message
}
