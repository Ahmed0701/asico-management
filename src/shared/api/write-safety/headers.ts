import type { AxiosHeaders, RawAxiosRequestHeaders } from "axios"
import type { WriteRequest } from "./types"

export function buildWriteHeaders(
  write: WriteRequest,
  base?: RawAxiosRequestHeaders | AxiosHeaders,
): RawAxiosRequestHeaders {
  const headers: RawAxiosRequestHeaders = { ...base as RawAxiosRequestHeaders }
  if (write.idempotencyKey) {
    headers["Idempotency-Key"] = write.idempotencyKey
  }
  if (write.ifMatch !== undefined) {
    headers["If-Match"] = String(write.ifMatch)
  }
  return headers
}
