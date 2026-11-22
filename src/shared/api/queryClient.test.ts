import { MutationObserver } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { SIDEBAR_COUNT_KEY } from "@/shared/layout/sidebarCountKey"
import { notificationsKeys } from "@/features/notifications/api/notifications.queries"
import { createAppQueryClient, NOTIFICATIONS_KEY } from "./queryClient"

// The sidebar counts follow a change at once: they are refreshed as soon as the server confirms it, not after the change's
// own page refresh (a mutation's onSuccess that waits for its list to reload).
describe("the app's query client", () => {
  it("refreshes the sidebar counts before a mutation's own refresh has finished", async () => {
    const client = createAppQueryClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")
    let finishPageRefresh: () => void = () => {}
    const pageRefresh = new Promise<void>((resolve) => {
      finishPageRefresh = resolve
    })
    const observer = new MutationObserver(client, {
      mutationFn: async () => "saved",
      // Like a page's mutation: it waits for its list to reload.
      onSuccess: () => pageRefresh,
    })

    const done = observer.mutate()
    await vi.waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({ queryKey: SIDEBAR_COUNT_KEY }),
    )
    // The page refresh is still running, and the mutation is not over yet.
    expect(observer.getCurrentResult().status).toBe("pending")

    finishPageRefresh()
    await done
    expect(observer.getCurrentResult().status).toBe("success")
  })

  it("refreshes the notifications after a change, since it may have finished what one is about", async () => {
    expect(NOTIFICATIONS_KEY).toEqual(notificationsKeys.all)
    const client = createAppQueryClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")
    const observer = new MutationObserver(client, {
      mutationFn: async () => "done",
    })

    await observer.mutate()

    expect(invalidate).toHaveBeenCalledWith({ queryKey: notificationsKeys.all })
  })

  it("leaves the counts alone when a change fails", async () => {
    const client = createAppQueryClient()
    const invalidate = vi.spyOn(client, "invalidateQueries")
    const observer = new MutationObserver(client, {
      mutationFn: async () => {
        throw new Error("refused")
      },
    })
    await observer.mutate().catch(() => undefined)
    expect(invalidate).not.toHaveBeenCalled()
  })
})
