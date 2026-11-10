import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import AuditChangeDiff from "./AuditChangeDiff"

const xss = "<img src=x onerror=alert(1)>"

describe("AuditChangeDiff safety", () => {
  it("renders markup in JSON as literal text", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AuditChangeDiff before={{ note: "safe" }} after={{ note: xss }} />
      </I18nextProvider>,
    )
    expect(document.querySelector("img")).toBeNull()
    expect(screen.getByText(xss)).toBeInTheDocument()
  })
})
