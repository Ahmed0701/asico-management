import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useDebouncedSearchParam } from "./useDebouncedSearchParam"

describe("useDebouncedSearchParam", () => {
  it("debounces normalized value into setParam", () => {
    vi.useFakeTimers()
    const setParam = vi.fn()
    const { result } = renderHook(() =>
      useDebouncedSearchParam(undefined, setParam, (v) => v.trim()),
    )
    act(() => result.current.setSearchDraft("  hello "))
    expect(setParam).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(400))
    expect(setParam).toHaveBeenCalledWith("search", "hello")
    vi.useRealTimers()
  })
})
