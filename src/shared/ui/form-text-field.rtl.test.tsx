import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { Form } from "./form"
import { FormTextField } from "./form-text-field"

function RtlFormFixture() {
  const form = useForm({
    defaultValues: { email: "", phone: "" },
  })
  return (
    <div dir="rtl" lang="ar">
      <Form {...form}>
        <form>
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            dir="ltr"
          />
          <FormTextField
            control={form.control}
            name="phone"
            label="Phone"
            dir="ltr"
          />
        </form>
      </Form>
    </div>
  )
}

describe("FormTextField in RTL", () => {
  it("keeps dir=ltr on email and phone inputs", () => {
    render(<RtlFormFixture />)
    expect(screen.getByLabelText("Email")).toHaveAttribute("dir", "ltr")
    expect(screen.getByLabelText("Phone")).toHaveAttribute("dir", "ltr")
  })
})
