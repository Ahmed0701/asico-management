import { useEffect, useState } from "react"

export function useDebouncedSearchParam(
  urlValue: string | undefined,
  setParam: (key: string, value: string | undefined) => void,
  normalize: (value: string) => string,
  delayMs = 400,
  paramKey = "search",
) {
  const [searchDraft, setSearchDraft] = useState(urlValue ?? "")

  useEffect(() => {
    setSearchDraft(urlValue ?? "")
  }, [urlValue])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = normalize(searchDraft)
      const current = urlValue ?? ""
      if (next !== current) setParam(paramKey, next || undefined)
    }, delayMs)
    return () => window.clearTimeout(handle)
  }, [searchDraft, urlValue, setParam, normalize, delayMs, paramKey])

  return { searchDraft, setSearchDraft }
}
