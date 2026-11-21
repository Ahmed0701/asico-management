import { fireEvent, render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/shared/i18n"
import { Form } from "./form"
import { FormTextField } from "./form-text-field"

function Harness({ type }: { type: "password" | "text" }) {
  const form = useForm<{ secret: string }>({
    defaultValues: { secret: "s3cret!" },
  })
  return (
    <I18nextProvider i18n={i18n}>
      <Form {...form}>
        <form>
          <FormTextField
            control={form.control}
            name="secret"
            label="Password"
            type={type}
          />
        </form>
      </Form>
    </I18nextProvider>
  )
}

describe("FormTextField: the password eye", () => {
  it("shows what was typed, and hides it again", () => {
    render(<Harness type="password" />)
    const input = screen.getByLabelText("Password") as HTMLInputElement
    expect(input.type).toBe("password")

    const eye = screen.getByRole("button", { name: "Show password" })
    expect(eye.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(eye)
    expect(input.type).toBe("text")
    expect(input.value).toBe("s3cret!")

    const hide = screen.getByRole("button", { name: "Hide password" })
    expect(hide.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(hide)
    expect(input.type).toBe("password")
  })

  it("is not a submit button, and other fields have no eye", () => {
    const { unmount } = render(<Harness type="password" />)
    expect(
      screen
        .getByRole("button", { name: "Show password" })
        .getAttribute("type"),
    ).toBe("button")
    unmount()
    render(<Harness type="text" />)
    expect(screen.queryByRole("button", { name: /password/i })).toBeNull()
  })
})
