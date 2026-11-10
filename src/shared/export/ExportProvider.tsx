import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { EXPORT_RATE_LIMIT_COOLDOWN_MS, type ExportFormat } from "./constants"

type ExportContextValue = {
  isExporting: boolean
  activeFormat: ExportFormat | null
  isCooldown: boolean
  runExport: (
    format: ExportFormat,
    task: (signal: AbortSignal) => Promise<void>,
  ) => Promise<void>
  cancelExport: () => void
  markRateLimited: () => void
}

const ExportContext = createContext<ExportContextValue | null>(null)

export function ExportProvider({ children }: { children: ReactNode }) {
  const [isExporting, setIsExporting] = useState(false)
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    if (!cooldownUntil) return
    const remaining = cooldownUntil - Date.now()
    if (remaining <= 0) {
      setCooldownUntil(null)
      return
    }
    const id = window.setTimeout(() => {
      setCooldownUntil(null)
      tick((n) => n + 1)
    }, remaining)
    return () => window.clearTimeout(id)
  }, [cooldownUntil])

  const cancelExport = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const markRateLimited = useCallback(() => {
    setCooldownUntil(Date.now() + EXPORT_RATE_LIMIT_COOLDOWN_MS)
  }, [])

  const exportingRef = useRef(false)

  const runExport = useCallback(
    async (
      format: ExportFormat,
      task: (signal: AbortSignal) => Promise<void>,
    ) => {
      if (exportingRef.current) return
      exportingRef.current = true
      const controller = new AbortController()
      abortRef.current = controller
      setIsExporting(true)
      setActiveFormat(format)
      try {
        await task(controller.signal)
      } finally {
        exportingRef.current = false
        abortRef.current = null
        setIsExporting(false)
        setActiveFormat(null)
      }
    },
    [],
  )

  const isCooldown = cooldownUntil !== null && cooldownUntil > Date.now()

  const value = useMemo(
    () => ({
      isExporting,
      activeFormat,
      isCooldown,
      runExport,
      cancelExport,
      markRateLimited,
    }),
    [
      isExporting,
      activeFormat,
      isCooldown,
      runExport,
      cancelExport,
      markRateLimited,
    ],
  )

  return (
    <ExportContext.Provider value={value}>{children}</ExportContext.Provider>
  )
}

export function useExportContext(): ExportContextValue {
  const ctx = useContext(ExportContext)
  if (!ctx) {
    throw new Error("useExportContext must be used within ExportProvider")
  }
  return ctx
}
