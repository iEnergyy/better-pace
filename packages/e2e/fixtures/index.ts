import { randomUUID } from "node:crypto"
import { test as base } from "@playwright/test"
import { DashboardPage } from "../pages/dashboard.page"
import { SettingsPage } from "../pages/settings.page"
import { SignInPage } from "../pages/sign-in.page"
import { SignUpPage } from "../pages/sign-up.page"

export type TestUser = {
  name: string
  email: string
  password: string
}

type AuthFixtures = {
  signInPage: SignInPage
  signUpPage: SignUpPage
  dashboardPage: DashboardPage
  settingsPage: SettingsPage
  testUser: TestUser
  /** Signs up `testUser` and lands on the dashboard. */
  authenticatedPage: DashboardPage
}

function createTestUser(): TestUser {
  return {
    name: "Founder Test",
    email: `founder-${randomUUID().slice(0, 10)}@example.com`,
    password: "test-password-123",
  }
}

export const test = base.extend<AuthFixtures>({
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page))
  },

  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page))
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page))
  },

  settingsPage: async ({ page }, use) => {
    await use(new SettingsPage(page))
  },

  // Playwright fixture factory — no parent fixtures needed.
  // biome-ignore lint/correctness/noEmptyPattern: intentional empty deps
  testUser: async ({}, use) => {
    await use(createTestUser())
  },

  authenticatedPage: async ({ signUpPage, dashboardPage, testUser }, use) => {
    await signUpPage.open()
    await signUpPage.signUp(testUser)
    await dashboardPage.expectLoaded()
    await use(dashboardPage)
  },
})

export { expect } from "@playwright/test"
