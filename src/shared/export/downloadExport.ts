import i18n from "@/shared/i18n"
import { getAccessToken } from "@/shared/auth/accessToken"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"
import { isApiErrorBody, isApiErrorFlatBody } from "@/shared/api/errors"
import type { ApiError } from "@/shared/api/types"
import { parseDownloadFilename } from "@/shared/lib/parseContentDisposition"
import type { ExportFilenameStem, ExportFormat } from "./constants"
import { EXPORT_FETCH_TIMEOUT_MS, fallbackExportFilename } from "./constants"

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
    message: i18n.t("export.failedGeneric"),
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

function toQueryString(
  query: Record<string, string | number | boolean>,
): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    sp.set(key, String(value))
  }
  return sp.toString()
}

export type DownloadExportOptions = {
  path: string
  query: Record<string, string | number | boolean>
  format: ExportFormat
  filenameStem: ExportFilenameStem
  signal?: AbortSignal
}

export async function downloadExport({
  path,
  query,
  format,
  filenameStem,
  signal,
}: DownloadExportOptions): Promise<void> {
  const token = getAccessToken()
  if (!token) {
    notifySessionExpired()
    throw errorFromResponse(401, {
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    })
  }

  const lang = i18n.language === "ar" ? "ar" : "en"
  const params = toQueryString({ ...query, format })
  const url = `/api/v1${path.startsWith("/") ? path : `/${path}`}?${params}`

  const timeout = AbortSignal.timeout(EXPORT_FETCH_TIMEOUT_MS)
  const combined = mergeAbortSignals(signal, timeout)

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": lang,
      },
      signal: combined,
    })
  } catch (err) {
    if (signal?.aborted) {
      throw err
    }
    throw errorFromResponse(0, {
      code: "NETWORK_ERROR",
      message: i18n.t("export.failedGeneric"),
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
    if (res.status === 401) {
      notifySessionExpired()
    }
    throw apiErr
  }

  let blob: Blob
  try {
    blob = await res.blob()
  } catch {
    throw errorFromResponse(0, {
      code: "NETWORK_ERROR",
      message: i18n.t("export.failedGeneric"),
    })
  }

  const fallback = fallbackExportFilename(filenameStem, format)
  const name = parseDownloadFilename(
    res.headers.get("Content-Disposition"),
    fallback,
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
    // Revoked later, not at once: a browser may still be reading the blob after click() returns.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }
}
