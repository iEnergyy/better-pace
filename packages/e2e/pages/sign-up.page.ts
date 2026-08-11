import { expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class SignUpPage extends BasePage {
  readonly nameInput = this.page.locator("#name")
  readonly emailInput = this.page.locator("#email")
  readonly passwordInput = this.page.locator("#password")
  readonly submitButton = this.page.getByRole("button", { name: "Sign up" })

  async open(): Promise<void> {
    await this.goto("/sign-up")
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/sign-up/)
    await expect(
      this.page.locator('[data-slot="card-title"]', {
        hasText: "Create account",
      })
    ).toBeVisible()
  }

  async signUp(input: {
    name: string
    email: string
    password: string
  }): Promise<void> {
    await this.nameInput.fill(input.name)
    await this.emailInput.fill(input.email)
    await this.passwordInput.fill(input.password)
    await this.submitButton.click()
  }
}
