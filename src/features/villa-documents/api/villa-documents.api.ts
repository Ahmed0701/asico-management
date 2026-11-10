import { api, unwrap } from "@/shared/api/client"
import type { ApiSuccess } from "@/shared/api/types"
import i18n from "@/shared/i18n"
import { getAccessToken } from "@/shared/auth/accessToken"
import { notifySessionExpired } from "@/shared/auth/sessionLifecycle"
import { isApiErrorBody, isApiErrorFlatBody } from "@/shared/api/errors"
import type { ApiError } from "@/shared/api/types"
import { VILLA_DOCUMENT_FIELD } from "./villa-documents.constants"
import type { VillaDocument } from "./villa-documents.types"

export { VILLA_DOCUMENT_FIELD }

function errorFromXhr(status: number, body: unknown): ApiError {
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
    message: i18n.t("villaDocuments.errors.uploadFailed"),
  }
}

export async function listVillaDocuments(
  villaId: string,
  signal?: AbortSignal,
): Promise<VillaDocument[]> {
  return unwrap(
    api.get<ApiSuccess<VillaDocument[]>>(`/villas/${villaId}/documents`, {
      signal,
    }),
  )
}

export async function deleteVillaDocument(id: string): Promise<void> {
  await api.delete(`/villa-documents/${id}`)
}

export function uploadVillaDocument(options: {
  villaId: string
  file: File
  idempotencyKey: string
  signal?: AbortSignal
  onProgress?: (ratio: number) => void
}): Promise<VillaDocument> {
  const token = getAccessToken()
  if (!token) {
    notifySessionExpired()
    return Promise.reject(
      errorFromXhr(401, { code: "UNAUTHORIZED", message: "Unauthorized" }),
    )
  }

  const lang = i18n.language === "ar" ? "ar" : "en"
  const url = `/api/v1/villas/${options.villaId}/documents`
  const form = new FormData()
  form.append(VILLA_DOCUMENT_FIELD, options.file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("Accept-Language", lang)
    xhr.setRequestHeader("Idempotency-Key", options.idempotencyKey)

    const abort = () => {
      xhr.abort()
      reject(new DOMException("Aborted", "AbortError"))
    }
    if (options.signal?.aborted) {
      abort()
      return
    }
    options.signal?.addEventListener("abort", abort, { once: true })

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && options.onProgress) {
        options.onProgress(Math.min(1, ev.loaded / ev.total))
      }
    }

    xhr.onload = () => {
      options.signal?.removeEventListener("abort", abort)
      let body: unknown = null
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        body = null
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        const data =
          body && typeof body === "object" && "data" in body
            ? (body as ApiSuccess<VillaDocument>).data
            : null
        if (data) resolve(data)
        else reject(errorFromXhr(xhr.status, body))
        return
      }
      if (xhr.status === 401) notifySessionExpired()
      reject(errorFromXhr(xhr.status, body))
    }

    xhr.onerror = () => {
      options.signal?.removeEventListener("abort", abort)
      reject(
        errorFromXhr(0, {
          code: "NETWORK_ERROR",
          message: i18n.t("villaDocuments.errors.uploadFailed"),
        }),
      )
    }

    xhr.onabort = () => {
      options.signal?.removeEventListener("abort", abort)
      reject(new DOMException("Aborted", "AbortError"))
    }

    xhr.send(form)
  })
}

export type VillaDocumentDisposition = "attachment" | "inline"

// Written over several lines: the project's formatter (oxfmt 0.2) drops the ";" of a one-line type and breaks it.
type VillaDocumentLink = {
  url: string
  expiresAt: string
}

/**
 * A signed URL to one document, valid for about a minute, that the browser opens by itself. Asked for through the normal API
 * client, so an expired session is refreshed first.
 */
export async function getVillaDocumentLink(
  documentId: string,
  disposition: VillaDocumentDisposition,
): Promise<string> {
  const { url } = await unwrap(
    api.post<ApiSuccess<VillaDocumentLink>>(
      `/villa-documents/${documentId}/link`,
      { disposition },
    ),
  )
  return url
}

/**
 * Downloads by letting the browser open the file link itself. The page never fetches the PDF, so a download manager or an
 * extension that takes over PDF responses cannot leave it with an empty file.
 */
export async function downloadVillaDocument(documentId: string): Promise<void> {
  const url = await getVillaDocumentLink(documentId, "attachment")
  const a = document.createElement("a")
  a.href = url
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/**
 * Opens the document in a new tab, in the browser's PDF viewer. The tab is opened at once, inside the click, so a popup blocker
 * allows it; it is pointed at the file when the link arrives, and closed again if the link cannot be made.
 */
export async function viewVillaDocument(documentId: string): Promise<void> {
  const tab = window.open("about:blank", "_blank")
  try {
    const url = await getVillaDocumentLink(documentId, "inline")
    if (tab) {
      tab.opener = null
      tab.location.href = url
    } else {
      window.location.assign(url)
    }
  } catch (err) {
    tab?.close()
    throw err
  }
}
