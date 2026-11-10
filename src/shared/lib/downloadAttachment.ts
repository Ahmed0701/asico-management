import i18n from "@/shared/i18n"
import { getAccessToken } from "@/shared/auth/accessToken"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"
import { isApiErrorBody, isApiErrorFlatBody } from "@/shared/api/errors"
import type { ApiError } from "@/shared/api/types"
import { parseDownloadFilename } from "@/shared/lib/parseContentDisposition"

const DEFAULT_TIMEOUT_MS = 120_000

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
    message: i18n.t("villaDocuments.errors.downloadFailed"),
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

export async function downloadAttachment(options: {
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
  const timeout = AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
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
      message: i18n.t("villaDocuments.errors.downloadFailed"),
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
  // An empty body is never a real document: it means the server handed the file to a proxy that did not send it
  // (FILE_DELIVERY=accel without nginx's protected location). Say so instead of saving a broken 0 KB file.
  if (blob.size === 0) {
    throw errorFromResponse(res.status, {
      code: "EMPTY_DOWNLOAD",
      message: i18n.t("villaDocuments.errors.downloadFailed"),
    })
  }
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
    // Revoked later, not at once: a browser may still be reading the blob after click() returns, and revoking it
    // then saves an empty or failed file.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
  }
}
