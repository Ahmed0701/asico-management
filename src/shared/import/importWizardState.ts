import type { ApiError } from "@/shared/api/types"
import { isImportReportClean } from "./importReport"
import type { ImportReport } from "./types"
import type { ClientImportFileError } from "./validateImportFile"

export type ImportWizardStep = "upload" | "review" | "success"

export type ImportWizardState = {
  step: ImportWizardStep
  file: File | null
  clientFileError: ClientImportFileError | null
  dryRunReport: ImportReport | null
  dryRunPassed: boolean
  confirmReport: ImportReport | null
  blockingError: ApiError | null
  headerMismatchDetails: ApiError["details"] | null
}

export const initialImportWizardState = (): ImportWizardState => ({
  step: "upload",
  file: null,
  clientFileError: null,
  dryRunReport: null,
  dryRunPassed: false,
  confirmReport: null,
  blockingError: null,
  headerMismatchDetails: null,
})

export type ImportWizardResetAction = { type: "RESET" }

export type ImportWizardSetFileAction = {
  type: "SET_FILE"
  file: File
}

export type ImportWizardClientFileErrorAction = {
  type: "CLIENT_FILE_ERROR"
  error: ClientImportFileError
}

export type ImportWizardDryRunOkAction = {
  type: "DRY_RUN_OK"
  report: ImportReport
}

export type ImportWizardDryRunRowErrorsAction = {
  type: "DRY_RUN_ROW_ERRORS"
  report: ImportReport
}

export type ImportWizardDryRunBlockedAction = {
  type: "DRY_RUN_BLOCKED"
  error: ApiError
}

export type ImportWizardConfirmOkAction = {
  type: "CONFIRM_OK"
  report: ImportReport
}

export type ImportWizardConfirmRowErrorsAction = {
  type: "CONFIRM_ROW_ERRORS"
  report: ImportReport
}

export type ImportWizardConfirmBlockedAction = {
  type: "CONFIRM_BLOCKED"
  error: ApiError
}

export type ImportWizardBackToUploadAction = { type: "BACK_TO_UPLOAD" }

export type ImportWizardAction = ImportWizardResetAction | ImportWizardSetFileAction | ImportWizardClientFileErrorAction | ImportWizardDryRunOkAction | ImportWizardDryRunRowErrorsAction | ImportWizardDryRunBlockedAction | ImportWizardConfirmOkAction | ImportWizardConfirmRowErrorsAction | ImportWizardConfirmBlockedAction | ImportWizardBackToUploadAction

export function importWizardReducer(
  state: ImportWizardState,
  action: ImportWizardAction,
): ImportWizardState {
  switch (action.type) {
    case "RESET":
      return initialImportWizardState()
    case "SET_FILE":
      return {
        ...initialImportWizardState(),
        step: "upload",
        file: action.file,
      }
    case "CLIENT_FILE_ERROR":
      return {
        ...state,
        clientFileError: action.error,
        dryRunReport: null,
        dryRunPassed: false,
        blockingError: null,
        headerMismatchDetails: null,
      }
    case "DRY_RUN_OK":
      return {
        ...state,
        step: "review",
        clientFileError: null,
        dryRunReport: action.report,
        dryRunPassed: isImportReportClean(action.report),
        blockingError: null,
        headerMismatchDetails: null,
        confirmReport: null,
      }
    case "DRY_RUN_ROW_ERRORS":
      return {
        ...state,
        step: "review",
        clientFileError: null,
        dryRunReport: action.report,
        dryRunPassed: false,
        blockingError: null,
        headerMismatchDetails: null,
      }
    case "DRY_RUN_BLOCKED":
      return {
        ...state,
        step: "upload",
        dryRunReport: null,
        dryRunPassed: false,
        blockingError: action.error,
        headerMismatchDetails:
          action.error.code === "IMPORT_HEADER_MISMATCH"
            ? (action.error.details ?? null)
            : null,
      }
    case "CONFIRM_OK":
      return {
        ...state,
        step: "success",
        confirmReport: action.report,
        blockingError: null,
      }
    case "CONFIRM_ROW_ERRORS":
      return {
        ...state,
        step: "review",
        dryRunPassed: false,
        dryRunReport: action.report,
        confirmReport: null,
        blockingError: null,
      }
    case "CONFIRM_BLOCKED":
      return {
        ...state,
        blockingError: action.error,
        headerMismatchDetails:
          action.error.code === "IMPORT_HEADER_MISMATCH"
            ? (action.error.details ?? null)
            : null,
        dryRunPassed:
          action.error.code === "IMPORT_DATA_CHANGED"
            ? false
            : state.dryRunPassed,
      }
    case "BACK_TO_UPLOAD":
      return {
        ...state,
        step: "upload",
        dryRunReport: null,
        dryRunPassed: false,
        confirmReport: null,
        blockingError: null,
        headerMismatchDetails: null,
        clientFileError: null,
      }
    default:
      return state
  }
}

export function canConfirmImport(state: ImportWizardState): boolean {
  return (
    state.step === "review" &&
    state.dryRunPassed &&
    state.file !== null &&
    state.dryRunReport !== null &&
    isImportReportClean(state.dryRunReport)
  )
}
