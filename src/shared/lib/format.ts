import i18n from "../i18n"

const locale = () => (i18n.language === "ar" ? "ar-u-nu-latn" : "en-GB")

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(locale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(locale(), {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

function download(content: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportCsv(
  filename: string,
  rows: Record<string, string | number | boolean>[],
) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const esc = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`
  const body = [
    headers.map(esc).join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n")
  download("﻿" + body, `${filename}.csv`, "text/csv;charset=utf-8")
}

export function exportJson(filename: string, rows: unknown[]) {
  download(
    JSON.stringify(rows, null, 2),
    `${filename}.json`,
    "application/json",
  )
}
