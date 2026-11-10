import { useCallback, useEffect, useRef, useState } from "react"
import { toApiError } from "../errors"
import type { ApiError } from "../types"
import {
  IdempotencyClientError,
  conflictVersionFromError,
  isRecordNotFound,
} from "./errors"
import { useIdempotencyKey } from "./useIdempotencyKey"
import type { VersionedEntity, WriteRequest } from "./types"

export function useVersionedWrite<T extends VersionedEntity>(options: {
  active: boolean
  entity: T | null | undefined
  recordLabel: string
  refetchFresh: () => Promise<T>
  onReloadFresh: (fresh: T) => void
}) {
  const idempotency = useIdempotencyKey(options.active)
  const ifMatchRef = useRef<number | undefined>(options.entity?.version)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [freshSnapshot, setFreshSnapshot] = useState<T | null>(null)
  const [applyPending, setApplyPending] = useState(false)
  const pendingResubmitRef = useRef<(() => Promise<void>) | null>(null)

  useEffect(() => {
    if (options.entity) {
      ifMatchRef.current = options.entity.version
    }
  }, [options.entity?.id, options.entity?.version, options.entity])

  const getWriteRequest = useCallback((): WriteRequest => {
    const req: WriteRequest = { idempotencyKey: idempotency.getKey() }
    if (ifMatchRef.current !== undefined) {
      req.ifMatch = ifMatchRef.current
    }
    return req
  }, [idempotency])

  const onSuccess = useCallback(() => {
    idempotency.resetKey()
  }, [idempotency])

  const handleError = useCallback(
    async (
      err: unknown,
      resubmit?: () => Promise<void>,
    ): Promise<ApiError | null> => {
      if (err instanceof IdempotencyClientError) {
        idempotency.rotateKey()
        return err.apiError
      }
      const apiErr = toApiError(err)
      if (apiErr.code === "VERSION_CONFLICT") {
        const fresh = await options.refetchFresh()
        setFreshSnapshot(fresh)
        const fromDetails = conflictVersionFromError(apiErr)
        if (fromDetails !== undefined) {
          ifMatchRef.current = fromDetails
        }
        pendingResubmitRef.current = resubmit ?? null
        setConflictOpen(true)
        return apiErr
      }
      if (isRecordNotFound(apiErr)) {
        return apiErr
      }
      if (apiErr.status >= 400 && apiErr.status < 500) {
        idempotency.markRejected()
      }
      return apiErr
    },
    [idempotency, options],
  )

  const closeConflict = useCallback(() => {
    setConflictOpen(false)
    setFreshSnapshot(null)
    pendingResubmitRef.current = null
  }, [])

  const reloadFresh = useCallback(async () => {
    if (!freshSnapshot) return
    options.onReloadFresh(freshSnapshot)
    ifMatchRef.current = freshSnapshot.version
    idempotency.resetKey()
    closeConflict()
  }, [closeConflict, freshSnapshot, idempotency, options])

  const applyOnTop = useCallback(async () => {
    if (!freshSnapshot) return
    ifMatchRef.current = freshSnapshot.version
    setApplyPending(true)
    try {
      const resubmit = pendingResubmitRef.current
      closeConflict()
      if (resubmit) await resubmit()
    } finally {
      setApplyPending(false)
    }
  }, [closeConflict, freshSnapshot])

  return {
    getWriteRequest,
    onSuccess,
    handleError,
    idempotency,
    conflictOpen,
    closeConflict,
    reloadFresh,
    applyOnTop,
    applyPending,
    recordLabel: options.recordLabel,
  }
}
