import { expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class SettingsPage extends BasePage {
  readonly emailInput = this.page.locator("#email")
  readonly displayNameInput = this.page.locator("#displayName")
  readonly saveButton = this.page.getByRole("button", { name: "Save changes" })
  readonly softDeleteButton = this.page.getByRole("button", {
    name: "Soft-delete account",
  })
  readonly savedMessage = this.page.getByText("Display name saved.")

  async open(): Promise<void> {
    await this.goto("/settings")
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/settings/)
    await expect(
      this.page.getByRole("heading", { name: "Settings" })
    ).toBeVisible()
  }

  async expectEmail(email: string): Promise<void> {
    await expect(this.emailInput).toHaveValue(email)
  }

  async updateDisplayName(displayName: string): Promise<void> {
    await this.displayNameInput.fill(displayName)
    await this.saveButton.click()
    await expect(this.savedMessage).toBeVisible()
  }

  async expectDisplayName(displayName: string): Promise<void> {
    await expect(this.displayNameInput).toHaveValue(displayName)
  }

  async softDeleteAccount(): Promise<void> {
    await this.softDeleteButton.click()
  }
}
