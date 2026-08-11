import { expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class SignInPage extends BasePage {
  readonly emailInput = this.page.locator("#email")
  readonly passwordInput = this.page.locator("#password")
  readonly submitButton = this.page.getByRole("button", { name: "Sign in" })

  async open(): Promise<void> {
    await this.goto("/sign-in")
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/sign-in/)
    await expect(
      this.page.locator('[data-slot="card-title"]', { hasText: "Sign in" })
    ).toBeVisible()
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
