import { expect } from "@playwright/test"
import { BasePage } from "./base.page"

export class DashboardPage extends BasePage {
  readonly brandHeading = this.page.getByRole("heading", { name: "PacePilot" })
  readonly signOutButton = this.page.getByRole("button", { name: "Sign out" })

  async open(): Promise<void> {
    await this.goto("/")
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL((url) => {
      const path = url.pathname.replace(/\/$/, "") || "/"
      return path === "/"
    })
    await expect(this.brandHeading).toBeVisible()
  }
}
