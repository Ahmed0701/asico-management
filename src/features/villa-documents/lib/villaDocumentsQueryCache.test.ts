import { describe, expect, it, vi } from "vitest"
import { QueryClient } from "@tanstack/react-query"
import { auditKeys } from "@/features/audit/api/audit.queries"
import { villasKeys } from "@/features/villas/api/villas.queries"
import { villaDocumentsKeys } from "../api/villa-documents.queries"
import { invalidateVillaDocumentsAfterWrite } from "./villaDocumentsQueryCache"

describe("invalidateVillaDocumentsAfterWrite", () => {
  it("invalidates documents list, villa detail, and audit", () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, "invalidateQueries")
    const villaId = "v1"
    invalidateVillaDocumentsAfterWrite(qc, villaId)
    expect(spy).toHaveBeenCalledWith({
      queryKey: villaDocumentsKeys.list(villaId),
    })
    expect(spy).toHaveBeenCalledWith({
      queryKey: villasKeys.detail(villaId),
    })
    expect(spy).toHaveBeenCalledWith({ queryKey: auditKeys.all })
  })
})
