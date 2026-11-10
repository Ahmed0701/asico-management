import { useCallback, useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { createIdempotencyKey } from "@/shared/api/write-safety/executeWrite"
import { toApiError } from "@/shared/api/errors"
import Button from "@/shared/ui/Button"
import { Progress } from "@/shared/ui/progress"
import { cn } from "@/shared/lib/cn"
import { toast } from "@/shared/lib/toast"
import {
  MAX_DOCUMENTS_PER_VILLA,
  villaDocumentApiErrorMessage,
  villaDocumentValidationMessage,
} from "../api"
import { useUploadVillaDocumentMutation } from "../api/villa-documents.queries"
import {
  validateVillaDocumentFile,
  validateVillaDocumentPdfSignature,
} from "../lib/validateVillaDocumentFile"

export default function VillaDocumentUploadZone({
  villaId,
  documentCount,
  disabled,
}: {
  villaId: string
  documentCount: number
  disabled: boolean
}) {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const upload = useUploadVillaDocumentMutation(villaId)
  const atLimit = documentCount >= MAX_DOCUMENTS_PER_VILLA
  const uploadDisabled = disabled || atLimit || upload.isPending

  const pickFile = () => {
    if (!uploadDisabled) inputRef.current?.click()
  }

  const runUpload = useCallback(
    async (file: File) => {
      const basic = validateVillaDocumentFile(file)
      if (!basic.ok) {
        toast.error(villaDocumentValidationMessage(t, basic.code))
        return
      }
      const sig = await validateVillaDocumentPdfSignature(file)
      if (!sig.ok) {
        toast.error(villaDocumentValidationMessage(t, sig.code))
        return
      }
      setProgress(0)
      try {
        await upload.mutateAsync({
          file,
          idempotencyKey: createIdempotencyKey(),
          onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
        })
        toast.success(t("villaDocuments.uploadSuccess"))
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        const apiErr = toApiError(err)
        toast.error(villaDocumentApiErrorMessage(t, apiErr))
      } finally {
        setProgress(null)
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [t, upload],
  )

  const onFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) void runUpload(file)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("villaDocuments.countOfMax", {
          count: documentCount,
          max: MAX_DOCUMENTS_PER_VILLA,
        })}
      </p>
      <div
        role="button"
        tabIndex={uploadDisabled ? -1 : 0}
        aria-disabled={uploadDisabled}
        aria-labelledby={inputId}
        className={cn(
          "rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors",
          dragOver && !uploadDisabled && "border-accent bg-accent/5",
          uploadDisabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
        onClick={pickFile}
        onKeyDown={(e) => {
          if (uploadDisabled) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            pickFile()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploadDisabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (uploadDisabled) return
          onFiles(e.dataTransfer.files)
        }}
      >
        <p id={inputId} className="text-sm font-medium">
          {atLimit
            ? t("villaDocuments.limitReached")
            : t("villaDocuments.dropHint")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("villaDocuments.pdfOnlyHint")}
        </p>
        {!atLimit && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={uploadDisabled}
            onClick={(e) => {
              e.stopPropagation()
              pickFile()
            }}
          >
            {t("villaDocuments.chooseFile")}
          </Button>
        )}
        <input
          ref={inputRef}
          id={`${inputId}-input`}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={uploadDisabled}
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>
      {progress !== null && (
        <div className="space-y-1">
          <Progress
            value={progress}
            aria-label={t("villaDocuments.uploading")}
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("villaDocuments.uploadProgress", { percent: progress })}
          </p>
        </div>
      )}
    </div>
  )
}
