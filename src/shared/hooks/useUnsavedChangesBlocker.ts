import { useCallback, useEffect, useRef, useState } from "react"
import { useBlocker } from "react-router"

/**
 * Blocks in-app navigation while `when` is true. Shows a caller-provided confirm UI
 * (no window.confirm). Call `runWithoutBlock` before intentional navigation (e.g. after save).
 */
export function useUnsavedChangesBlocker(when: boolean) {
  const allowNavigationRef = useRef(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const blocker = useBlocker(when && !allowNavigationRef.current)

  useEffect(() => {
    if (blocker.state === "blocked") {
      setConfirmOpen(true)
    }
  }, [blocker.state])

  const stayOnPage = useCallback(() => {
    setConfirmOpen(false)
    if (blocker.state === "blocked") blocker.reset()
  }, [blocker])

  const confirmLeave = useCallback(() => {
    setConfirmOpen(false)
    if (blocker.state === "blocked") blocker.proceed()
  }, [blocker])

  const runWithoutBlock = useCallback((fn: () => void) => {
    allowNavigationRef.current = true
    fn()
  }, [])

  return {
    confirmOpen,
    stayOnPage,
    confirmLeave,
    runWithoutBlock,
    setConfirmOpen,
  }
}
