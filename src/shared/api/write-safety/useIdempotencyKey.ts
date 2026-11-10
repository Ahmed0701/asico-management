import { useCallback, useEffect, useRef } from "react"
import { createIdempotencyKey } from "./executeWrite"

/**
 * One idempotency key per user action. Call getKey() when sending the request.
 */
export function useIdempotencyKey(active = true) {
  const keyRef = useRef(createIdempotencyKey())
  const hadRejectRef = useRef(false)

  const resetKey = useCallback(() => {
    keyRef.current = createIdempotencyKey()
    hadRejectRef.current = false
  }, [])

  const rotateKey = useCallback(() => {
    keyRef.current = createIdempotencyKey()
  }, [])

  const getKey = useCallback(() => keyRef.current, [])

  const markRejected = useCallback(() => {
    hadRejectRef.current = true
  }, [])

  const onEditAfterReject = useCallback(() => {
    if (hadRejectRef.current) {
      rotateKey()
      hadRejectRef.current = false
    }
  }, [rotateKey])

  useEffect(() => {
    if (active) resetKey()
  }, [active, resetKey])

  return {
    getKey,
    resetKey,
    rotateKey,
    markRejected,
    onEditAfterReject,
  }
}
