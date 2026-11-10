import i18n from "@/shared/i18n"
import { getAccessToken } from "@/shared/auth/accessToken"
import { API_BASE_URL } from "@/shared/config/apiBase"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"
import { isApiErrorBody, isApiErrorFlatBody } from "@/shared/api/errors"
import type { ApiError } from "@/shared/api/types"
import { parseDownloadFilename } from "@/shared/lib/parseContentDisposition"
import { parseImportReport } from "./importReport"
import type { ImportReport } from "./types"

const IMPORT_FETCH_TIMEOUT_MS = 120_000

function errorFromResponse(status: number, body: unknown): ApiError {
  if (isApiErrorFlatBody(body)) {
    return {
      status,
      code: body.code,
      message: body.message,
      details: body.details,
      requestId: body.requestId,
    }
  }
  if (isApiErrorBody(body)) {
    return {
      status,
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
    }
  }
  return {
    status,
    code: "UNKNOWN",
    message: i18n.t("import.failedGeneric"),
  }
}

function mergeAbortSignals(
  a: AbortSignal | undefined,
  b: AbortSignal,
): AbortSignal {
  if (!a) return b
  if (a.aborted || b.aborted) {
    const controller = new AbortController()
    controller.abort()
    return controller.signal
  }
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  a.addEventListener("abort", onAbort)
  b.addEventListener("abort", onAbort)
  return controller.signal
}

export async function downloadImportTemplate(options: {
  path: string
  fallbackFilename: string
  signal?: AbortSignal
}): Promise<void> {
  const token = getAccessToken()
  if (!token) {
    notifySessionExpired()
    throw errorFromResponse(401, {
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  }

  const lang = i18n.language === "ar" ? "ar" : "en"
  const url = `/api/v1${
    options.path.startsWith("/") ? options.path : `/${options.path}`
  }`
  const timeout = AbortSignal.timeout(IMPORT_FETCH_TIMEOUT_MS)
  const combined = mergeAbortSignals(options.signal, timeout)

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": lang,
      },
      signal: combined,
    })
  } catch {
    throw errorFromResponse(0, {
      code: "NETWORK_ERROR",
      message: i18n.t("import.failedGeneric"),
    })
  }

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = null
    }
    const apiErr = errorFromResponse(res.status, body ?? { code: "UNKNOWN" })
    if (res.status === 401) notifySessionExpired()
    throw apiErr
  }

  const blob = await res.blob()
  const name = parseDownloadFilename(
    res.headers.get("Content-Disposition"),
    options.fallbackFilename,
  )

  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement("a")
    a.href = objectUrl
    a.download = name
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export type PostImportReportResult = {
  kind: "report"
  status: 200 | 201 | 422
  report: ImportReport
}

export type PostImportErrorResult = {
  kind: "error"
  error: ApiError
}

export type PostImportResult = PostImportReportResult | PostImportErrorResult

export async function postImport(options: {
  path: string
  file: File
  dryRun: boolean
  idempotencyKey: string
  signal?: AbortSignal
}): Promise<PostImportResult> {
  const token = getAccessToken()
  if (!token) {
    notifySessionExpired()
    return {
      kind: "error",
      error: errorFromResponse(401, {
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      }),
    }
  }

  const lang = i18n.language === "ar" ? "ar" : "en"
  const base = options.path.startsWith("/") ? options.path : `/${options.path}`
  const url = `${API_BASE_URL}${base}${options.dryRun ? "?dryRun=true" : ""}`

  const form = new FormData()
  form.append("file", options.file)

  const timeout = AbortSignal.timeout(IMPORT_FETCH_TIMEOUT_MS)
  const combined = mergeAbortSignals(options.signal, timeout)

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": lang,
        "Idempotency-Key": options.idempotencyKey,
      },
      body: form,
      signal: combined,
    })
  } catch {
    return {
      kind: "error",
      error: errorFromResponse(0, {
        code: "NETWORK_ERROR",
        message: i18n.t("import.failedGeneric"),
      }),
    }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = null
  }

  const data =
    body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : undefined
  const report = parseImportReport(data)

  if (res.status === 200 || res.status === 201) {
    if (!report) {
      return {
        kind: "error",
        error: errorFromResponse(res.status, body),
      }
    }
    return { kind: "report", status: res.status, report }
  }

  if (res.status === 422 && report) {
    return { kind: "report", status: 422, report }
  }

  if (res.status === 401) notifySessionExpired()

  return {
    kind: "error",
    error: errorFromResponse(res.status, body ?? { code: "UNKNOWN" }),
  }
}
