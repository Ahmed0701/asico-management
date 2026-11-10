import { useEffect, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { cn } from "../lib/cn"
import Button, { IconButton } from "./Button"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: "sm" | "md" | "lg"
  children: ReactNode
  footer?: ReactNode
}

const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" }

export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: ModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-[fade-in_.15s]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-xl border border-border bg-card text-card-foreground shadow-2xl animate-[pop-in_.2s_ease-out] sm:rounded-xl",
          sizes[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <IconButton icon="x" label={t("common.close")} onClick={onClose} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 px-6 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmVariant = "danger",
  closeOnConfirm = true,
  confirmPending = false,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: "danger" | "primary"
  closeOnConfirm?: boolean
  confirmPending?: boolean
  children?: ReactNode
}) {
  const { t } = useTranslation()
  const busy = confirmPending
  const handleClose = busy ? () => {} : onClose
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" autoFocus disabled={busy} onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={confirmVariant}
            disabled={busy}
            onClick={() => {
              if (busy) return
              void Promise.resolve(onConfirm()).then(() => {
                if (closeOnConfirm) onClose()
              })
            }}
          >
            {confirmLabel ?? t("common.delete")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
      {children}
    </Modal>
  )
}
