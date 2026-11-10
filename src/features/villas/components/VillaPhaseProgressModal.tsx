import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { toApiError } from "@/shared/api/errors"
import { conflictVersionFromError } from "@/shared/api/write-safety"
import { clampProgressPercent } from "@/shared/lib/progressDisplay"
import Modal from "@/shared/ui/Modal"
import Button from "@/shared/ui/Button"
import VersionConflictDialog from "@/shared/ui/VersionConflictDialog"
import {
  getVilla,
  useUpdateVillaPhaseProgressMutation,
  type VillaPhaseProgress,
} from "../api"

export default function VillaPhaseProgressModal({
  open,
  villaId,
  phase,
  onClose,
}: {
  open: boolean
  villaId: string
  phase: VillaPhaseProgress | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const mutation = useUpdateVillaPhaseProgressMutation()
  const ifMatchRef = useRef<number | undefined>(phase?.version)
  const [conflictOpen, setConflictOpen] = useState(false)
  const [clientMessage, setClientMessage] = useState<string | null>(null)
  const [value, setValue] = useState(0)
  const baselineRef = useRef(0)

  useEffect(() => {
    if (open && phase) {
      ifMatchRef.current = phase.version
      const start = clampProgressPercent(phase.progress)
      baselineRef.current = start
      setValue(start)
      setClientMessage(null)
    }
  }, [open, phase])

  const handleClose = () => {
    if (mutation.isPending) return
    onClose()
  }

  const unchanged = phase !== null && value === baselineRef.current

  const submit = async (progress: number) => {
    if (!phase) return
    setClientMessage(null)
    try {
      await mutation.mutateAsync({
        villaId,
        elecPhaseId: phase.elecPhaseId,
        progress,
        write: { ifMatch: ifMatchRef.current },
      })
      onClose()
    } catch (err) {
      const parsed = toApiError(err)
      if (parsed.code === "VERSION_CONFLICT") {
        const fresh = await getVilla(villaId)
        const freshPhase = fresh.phases.find(
          (p) => p.elecPhaseId === phase.elecPhaseId,
        )
        if (freshPhase) {
          ifMatchRef.current =
            conflictVersionFromError(parsed) ?? freshPhase.version
        }
        setConflictOpen(true)
        return
      }
      if (parsed.code === "ELEC_PHASE_INACTIVE") {
        setClientMessage(t("villas.elecPhaseInactive"))
        return
      }
      setClientMessage(parsed.message)
    }
  }

  if (!phase) return null

  const title = t("villas.phaseProgressTitle", { phaseName: phase.name })

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={title}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={mutation.isPending}
              onClick={handleClose}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending || unchanged}
              onClick={() => void submit(value)}
            >
              {t("villas.phaseProgressSave")}
            </Button>
          </>
        }
      >
        {clientMessage && (
          <p className="mb-4 text-sm text-danger" role="alert">
            {clientMessage}
          </p>
        )}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            style={{ "--phase-fill": `${value}%` } as CSSProperties}
            className="phase-progress-range h-2 min-w-0 flex-1"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
            aria-label={t("villas.phaseProgressField")}
          />
          <span
            className="w-12 shrink-0 text-end text-sm font-semibold tabular-nums text-foreground"
            aria-hidden
          >
            {value}%
          </span>
        </div>
      </Modal>
      <VersionConflictDialog
        open={conflictOpen}
        recordLabel={phase.name}
        onReload={async () => {
          const fresh = await getVilla(villaId)
          const freshPhase = fresh.phases.find(
            (p) => p.elecPhaseId === phase.elecPhaseId,
          )
          if (freshPhase) {
            ifMatchRef.current = freshPhase.version
            const next = clampProgressPercent(freshPhase.progress)
            baselineRef.current = next
            setValue(next)
          }
          setConflictOpen(false)
        }}
        onApplyOnTop={async () => {
          setConflictOpen(false)
          await submit(value)
        }}
        onClose={() => setConflictOpen(false)}
        applyPending={mutation.isPending}
      />
    </>
  )
}
