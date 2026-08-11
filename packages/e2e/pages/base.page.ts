import type { Locator, Page } from "@playwright/test"

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path, { waitUntil: "networkidle" })
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: "networkidle" })
  }

  url(): string {
    return this.page.url()
  }

  heading(name: string | RegExp): Locator {
    return this.page.getByRole("heading", { name })
  }
}
