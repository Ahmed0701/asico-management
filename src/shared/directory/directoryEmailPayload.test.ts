import { describe, expect, it } from "vitest"
import { DIRECTORY_EMAIL_API_ENABLED } from "@/shared/config/directoryEmail"
import {
  directoryEmailForApi,
  directoryEmailFromApi,
  stripDirectoryEmailFromPayload,
} from "./directoryEmailPayload"

describe("directoryEmailPayload", () => {
  it("maps API null/undefined email to empty form value", () => {
    expect(directoryEmailFromApi(null)).toBe("")
    expect(directoryEmailFromApi(undefined)).toBe("")
    expect(directoryEmailFromApi("a@b.co")).toBe("a@b.co")
  })

  it("maps empty form email to null for API", () => {
    expect(directoryEmailForApi("")).toBeNull()
    expect(directoryEmailForApi("  ")).toBeNull()
    expect(directoryEmailForApi("a@b.co")).toBe("a@b.co")
  })

  it("passes email through create/update payloads when API is enabled", () => {
    expect(DIRECTORY_EMAIL_API_ENABLED).toBe(true)
    expect(
      stripDirectoryEmailFromPayload({
        name: "Acme",
        phone: "+96550000000",
        email: "a@b.co",
      }),
    ).toEqual({
      name: "Acme",
      phone: "+96550000000",
      email: "a@b.co",
    })
  })
})
