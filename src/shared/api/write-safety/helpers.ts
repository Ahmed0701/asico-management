import type { WriteRequest } from "./types"

export function ifMatchWrite(
  version: number | undefined,
): Pick<WriteRequest, "ifMatch"> {
  return version !== undefined ? { ifMatch: version } : {}
}

export function idempotencyWrite(key: string): WriteRequest {
  return { idempotencyKey: key }
}

export function fullWrite(
  key: string,
  version: number | undefined,
): WriteRequest {
  const write: WriteRequest = { idempotencyKey: key }
  if (version !== undefined) write.ifMatch = version
  return write
}
