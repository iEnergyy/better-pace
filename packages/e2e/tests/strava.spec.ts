import { expect, test } from "../fixtures"

test.describe("strava connection UI", () => {
  test("settings shows Connect Strava and dashboard CTA links to OAuth start", async ({
    authenticatedPage,
    settingsPage,
    page,
  }) => {
    await authenticatedPage.expectLoaded()
    await expect(
      page.getByRole("link", { name: "Connect Strava" })
    ).toHaveAttribute("href", "/api/strava/connect")

    await settingsPage.open()
    await settingsPage.expectLoaded()
    await expect(page.getByRole("heading", { name: "Strava" })).toBeVisible()
    const connect = page.getByRole("link", { name: "Connect Strava" })
    await expect(connect).toBeVisible()
    await expect(connect).toHaveAttribute("href", "/api/strava/connect")

    const html = await page.content()
    expect(html).not.toMatch(/access_token/i)
    expect(html).not.toMatch(/refresh_token/i)
    expect(html).not.toMatch(/accessTokenEncrypted/)
  })

  test("connect route redirects unauthenticated users to sign-in", async ({
    page,
  }) => {
    await page.goto("/api/strava/connect")
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
