import i18n from "@/shared/i18n"
import { getAccessToken } from "@/shared/auth/accessToken"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"
import { isApiErrorBody, isApiErrorFlatBody } from "@/shared/api/errors"
import type { ApiError } from "@/shared/api/types"
import { parseDownloadFilename } from "@/shared/lib/parseContentDisposition"
import type { ExportFilenameStem, ExportFormat } from "./constants"
import { EXPORT_FETCH_TIMEOUT_MS, fallbackExportFilename } from "./constants"
import { activeColumnChooser } from "./columnChoice"

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

// The titles of the columns the export would write (describe=columns): nothing is made or counted by the server.
async function describeColumns(
  base: string,
  query: Record<string, string | number | boolean>,
  format: ExportFormat,
  headers: Record<string, string>,
  signal: AbortSignal | undefined,
): Promise<string[]> {
  const params = toQueryString({ ...query, format, describe: "columns" })
  let res: Response
  try {
    res = await fetch(`${base}?${params}`, {
      headers,
      ...(signal && { signal }),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw errorFromResponse(0, {
      code: "NETWORK_ERROR",
      message: i18n.t("export.failedGeneric"),
    })
  }
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  if (!res.ok) {
    if (res.status === 401) notifySessionExpired()
    throw errorFromResponse(res.status, body ?? { code: "UNKNOWN" })
  }
  const columns = (body as { data?: { columns?: unknown } } | null)?.data
    ?.columns
  if (
    !Array.isArray(columns) ||
    columns.length === 0 ||
    !columns.every((title) => typeof title === "string")
  ) {
    throw errorFromResponse(0, {
      code: "EXPORT_COLUMNS_UNAVAILABLE",
      message: i18n.t("export.columns.unavailable"),
    })
  }
  return columns
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
  const headers = { Authorization: `Bearer ${token}`, "Accept-Language": lang }
  const base = `/api/v1${path.startsWith("/") ? path : `/${path}`}`

  // "Choose columns": ask the server for the file's column titles, let the person pick, then ask for those only.
  let columns: string[] | undefined
  const chooser = activeColumnChooser()
  if (chooser) {
    const available = await describeColumns(
      base,
      query,
      format,
      headers,
      signal,
    )
    // Cancelling the export while the dialog is open answers it as cancelled too.
    const picked = await new Promise<string[] | null>((resolve, reject) => {
      const onAbort = () => resolve(null)
      signal?.addEventListener("abort", onAbort, { once: true })
      chooser({ columns: available, format, key: `${path}|${format}` }).then(
        (chosen) => {
          signal?.removeEventListener("abort", onAbort)
          resolve(chosen)
        },
        reject,
      )
    })
    if (picked === null) throw new DOMException("cancelled", "AbortError")
    if (picked.length < available.length) columns = picked
  }

  const params = toQueryString({
    ...query,
    format,
    ...(columns && { columns: columns.join(",") }),
  })
  const url = `${base}?${params}`

  const timeout = AbortSignal.timeout(EXPORT_FETCH_TIMEOUT_MS)
  const combined = mergeAbortSignals(signal, timeout)

  let res: Response
  try {
    res = await fetch(url, { headers, signal: combined })
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
