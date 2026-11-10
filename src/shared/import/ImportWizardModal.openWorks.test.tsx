import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { IMPORT_RESOURCES } from "./types"
import ImportWizardModal from "./ImportWizardModal"

describe("ImportWizardModal open works copy", () => {
  it("lists template columns without Title", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ImportWizardModal
          open
          onClose={() => {}}
          config={IMPORT_RESOURCES["open-works"]}
          onSuccess={() => {}}
        />
      </I18nextProvider>,
    )
    const note = i18n.t("import.resources.open-works.columnsNote")
    expect(note).toMatch(/Villa Number/)
    expect(note).toMatch(/Electrical Phase/)
    expect(note).not.toMatch(/Title/)
    expect(screen.getByText(note)).toBeInTheDocument()
  })
})
