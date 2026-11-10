import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { toApiError } from "@/shared/api/errors"
import { createIdempotencyKey } from "@/shared/api/write-safety/executeWrite"
import { cn } from "@/shared/lib/cn"
import Button from "@/shared/ui/Button"
import Modal from "@/shared/ui/Modal"
import { downloadImportTemplate, postImport } from "./importApi"
import {
  importRowsToCreate,
  mapReportErrorsToTable,
  reportHasMoreErrors,
} from "./importReport"
import {
  canConfirmImport,
  importWizardReducer,
  initialImportWizardState,
} from "./importWizardState"
import {
  importRateLimitHint,
  localizedImportApiError,
} from "./mapImportApiError"
import type { ImportResourceConfig } from "./types"
import { validateImportFileClient } from "./validateImportFile"
import { IMPORT_MAX_FILE_BYTES, IMPORT_XLSX_EXTENSION } from "./constants"

type ImportWizardModalProps = {
  open: boolean
  onClose: () => void
  config: ImportResourceConfig
  onSuccess?: () => void
  /** When true, explains that each row is saved to the villa named in the file. */
  villaRowTargetNote?: boolean
}

function formatBytes(max: number): string {
  const mb = max / (1024 * 1024)
  return `${mb} MB`
}

export default function ImportWizardModal({
  open,
  onClose,
  config,
  onSuccess,
  villaRowTargetNote = false,
}: ImportWizardModalProps) {
  const { t, i18n } = useTranslation()
  const [state, dispatch] = useReducer(
    importWizardReducer,
    undefined,
    initialImportWizardState,
  )
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [dryRunning, setDryRunning] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const dryRunKeyRef = useRef(createIdempotencyKey())
  const confirmKeyRef = useRef(createIdempotencyKey())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const liveRegionId = useId()
  const dropLabelId = useId()

  const resetKeys = useCallback(() => {
    dryRunKeyRef.current = createIdempotencyKey()
    confirmKeyRef.current = createIdempotencyKey()
  }, [])

  useEffect(() => {
    if (!open) {
      dispatch({ type: "RESET" })
      resetKeys()
      setDryRunning(false)
      setConfirming(false)
    }
  }, [open, resetKeys])

  const handleClose = () => {
    if (dryRunning || confirming) return
    onClose()
  }

  const pickFile = (file: File | null) => {
    if (!file) return
    resetKeys()
    dispatch({ type: "SET_FILE", file })
    const clientErr = validateImportFileClient(file)
    if (clientErr) {
      dispatch({ type: "CLIENT_FILE_ERROR", error: clientErr })
    }
  }

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    pickFile(file)
    e.target.value = ""
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    pickFile(e.dataTransfer.files?.[0] ?? null)
  }

  const onDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      await downloadImportTemplate({
        path: config.templatePath,
        fallbackFilename: config.templateFallbackFilename,
      })
    } catch (err) {
      dispatch({
        type: "DRY_RUN_BLOCKED",
        error: toApiError(err),
      })
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const runDryRun = async () => {
    if (!state.file) return
    setDryRunning(true)
    try {
      const result = await postImport({
        path: config.importPath,
        file: state.file,
        dryRun: true,
        idempotencyKey: dryRunKeyRef.current,
      })
      if (result.kind === "error") {
        dispatch({ type: "DRY_RUN_BLOCKED", error: result.error })
        return
      }
      const { report } = result
      if (report.ok && report.errors.length === 0) {
        dispatch({ type: "DRY_RUN_OK", report })
      } else {
        dispatch({ type: "DRY_RUN_ROW_ERRORS", report })
      }
    } finally {
      setDryRunning(false)
    }
  }

  const runConfirm = async () => {
    if (!state.file || !canConfirmImport(state)) return
    setConfirming(true)
    confirmKeyRef.current = createIdempotencyKey()
    try {
      const result = await postImport({
        path: config.importPath,
        file: state.file,
        dryRun: false,
        idempotencyKey: confirmKeyRef.current,
      })
      if (result.kind === "error") {
        dispatch({ type: "CONFIRM_BLOCKED", error: result.error })
        return
      }
      if (result.status === 422 || !result.report.ok) {
        dispatch({ type: "CONFIRM_ROW_ERRORS", report: result.report })
        return
      }
      dispatch({ type: "CONFIRM_OK", report: result.report })
      onSuccess?.()
    } finally {
      setConfirming(false)
    }
  }

  const clientErrorMessage = (() => {
    if (!state.clientFileError) return null
    switch (state.clientFileError.code) {
      case "IMPORT_FILE_TOO_LARGE":
        return t("import.errors.fileTooLarge")
      case "IMPORT_FILE_TYPE":
        return t("import.errors.unsupportedType")
      case "IMPORT_FILE_EMPTY":
        return t("import.errors.noFile")
      default:
        return t("import.failedGeneric")
    }
  })()

  const blockingMessage = state.blockingError
    ? localizedImportApiError(t, state.blockingError)
    : null
  const rateHint = state.blockingError
    ? importRateLimitHint(t, state.blockingError)
    : null

  const errorRows =
    state.dryRunReport && state.dryRunReport.errors.length > 0
      ? mapReportErrorsToTable(state.dryRunReport.errors)
      : []

  const liveSummary = (() => {
    if (state.step === "success" && state.confirmReport) {
      return t("import.live.success", {
        count: state.confirmReport.imported,
      })
    }
    if (state.dryRunReport) {
      return state.dryRunPassed
        ? t("import.live.dryRunOk", {
            count: importRowsToCreate(state.dryRunReport),
          })
        : t("import.live.dryRunErrors", {
            count: state.dryRunReport.errors.length,
          })
    }
    return ""
  })()

  const title = t(`import.resources.${config.id}.title`)
  const description = t(`import.resources.${config.id}.description`)
  const importExtraNotes = [
    villaRowTargetNote ? t("import.villaRowTargetNote") : null,
    config.id === "villas" ? t("import.resources.villas.budgetNote") : null,
    config.id === "open-works"
      ? t("import.resources.open-works.columnsNote")
      : null,
    config.id === "small-works"
      ? t("import.resources.small-works.columnsNote")
      : null,
  ].filter(Boolean) as string[]

  const footer =
    state.step === "success" ? (
      <>
        <Button type="button" variant="primary" onClick={handleClose}>
          {t("common.close")}
        </Button>
      </>
    ) : (
      <>
        <Button
          type="button"
          disabled={dryRunning || confirming}
          onClick={handleClose}
        >
          {t("common.cancel")}
        </Button>
        {state.step === "review" && (
          <Button
            type="button"
            variant="secondary"
            disabled={dryRunning || confirming}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("import.actions.chooseAnotherFile")}
          </Button>
        )}
        {state.step === "upload" && (
          <Button
            type="button"
            variant="primary"
            disabled={!state.file || dryRunning || !!clientErrorMessage}
            onClick={() => void runDryRun()}
          >
            {dryRunning
              ? t("import.actions.checking")
              : t("import.actions.checkFile")}
          </Button>
        )}
        {state.step === "review" && (
          <Button
            type="button"
            variant="primary"
            disabled={!canConfirmImport(state) || confirming || dryRunning}
            onClick={() => void runConfirm()}
          >
            {confirming
              ? t("import.actions.importing")
              : t("import.actions.confirmImport")}
          </Button>
        )}
      </>
    )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="lg"
      footer={footer}
    >
      <div className="space-y-5" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
        <div
          id={liveRegionId}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveSummary}
        </div>

        {importExtraNotes.length > 0 &&
          state.step !== "success" &&
          importExtraNotes.map((note) => (
            <p key={note} className="text-xs text-muted-foreground">
              {note}
            </p>
          ))}

        {state.step !== "success" && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              icon="download"
              disabled={downloadingTemplate || dryRunning || confirming}
              onClick={() => void onDownloadTemplate()}
            >
              {t("import.actions.downloadTemplate")}
            </Button>
          </div>
        )}

        {state.step === "success" && state.confirmReport && (
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-4">
            <p className="text-sm font-medium">{t("import.success.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("import.success.body", {
                count: state.confirmReport.imported,
              })}
            </p>
            <Link
              to={config.listPath}
              className="mt-3 inline-block text-sm text-accent hover:underline"
              onClick={handleClose}
            >
              {t(`import.resources.${config.id}.backToList`)}
            </Link>
          </div>
        )}

        {state.step !== "success" && (
          <>
            <div
              className={cn(
                "rounded-lg border border-dashed border-border px-4 py-8 text-center transition-colors",
                "hover:border-accent/50",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              aria-labelledby={dropLabelId}
            >
              <p id={dropLabelId} className="text-sm font-medium">
                {t("import.drop.title")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("import.drop.hint", {
                  ext: IMPORT_XLSX_EXTENSION,
                  max: formatBytes(IMPORT_MAX_FILE_BYTES),
                })}
              </p>
              {state.file && (
                <p className="mt-3 text-sm text-foreground" dir="ltr">
                  {state.file.name}
                </p>
              )}
              <Button
                type="button"
                variant="secondary"
                className="mt-4"
                disabled={dryRunning || confirming}
                onClick={() => fileInputRef.current?.click()}
              >
                {t("import.actions.chooseFile")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={IMPORT_XLSX_EXTENSION}
                className="sr-only"
                onChange={onFileInputChange}
              />
            </div>

            {clientErrorMessage && (
              <p role="alert" className="text-sm text-destructive">
                {clientErrorMessage}
              </p>
            )}

            {blockingMessage && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
              >
                <p>{blockingMessage}</p>
                {rateHint && (
                  <p className="mt-1 text-muted-foreground">{rateHint}</p>
                )}
                {state.headerMismatchDetails &&
                  state.headerMismatchDetails.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-xs">
                      {state.headerMismatchDetails.map((d) => (
                        <li key={`${d.path}-${d.message}`}>
                          <span className="font-medium" dir="ltr">
                            {d.path}
                          </span>
                          {": "}
                          {d.message}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            )}

            {state.dryRunReport && state.step === "review" && (
              <div className="space-y-3">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">
                      {t("import.stats.totalRows")}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {state.dryRunReport.total}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">
                      {t("import.stats.willCreate")}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {state.dryRunPassed
                        ? importRowsToCreate(state.dryRunReport)
                        : 0}
                    </dd>
                  </div>
                  {state.dryRunReport.skipped > 0 && (
                    <div>
                      <dt className="text-muted-foreground">
                        {t("import.stats.skipped")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {state.dryRunReport.skipped}
                      </dd>
                    </div>
                  )}
                </dl>

                {errorRows.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      {t("import.errorsTable.title")}
                    </p>
                    <div className="max-h-64 overflow-auto rounded-lg border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-muted/80">
                          <tr>
                            <th className="px-3 py-2 font-medium">
                              {t("import.errorsTable.row")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {t("import.errorsTable.column")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {t("import.errorsTable.message")}
                            </th>
                            <th className="px-3 py-2 font-medium">
                              {t("import.errorsTable.value")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {errorRows.map((row) => (
                            <tr key={row.id} className="border-t border-border">
                              <td className="px-3 py-2 tabular-nums">
                                {row.row}
                              </td>
                              <td className="px-3 py-2" dir="ltr">
                                {row.column}
                              </td>
                              <td className="px-3 py-2">{row.message}</td>
                              <td
                                className="max-w-32 truncate px-3 py-2 text-muted-foreground"
                                dir="auto"
                                title={row.value ?? undefined}
                              >
                                {row.value ??
                                  t("import.errorsTable.emptyValue")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {reportHasMoreErrors(state.dryRunReport) && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t("import.errorsTable.andMore")}
                      </p>
                    )}
                  </div>
                )}

                {state.dryRunPassed && (
                  <p className="text-sm text-closed">
                    {t("import.review.readyToImport")}
                  </p>
                )}
                {!state.dryRunPassed && errorRows.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("import.review.fixAndRetry")}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
