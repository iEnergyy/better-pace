import { expect, test } from "../fixtures"

test.describe("auth account flow", () => {
  test("guards dashboard and completes signup → settings → soft-delete → re-signin", async ({
    page,
    signInPage,
    signUpPage,
    dashboardPage,
    settingsPage,
    testUser,
  }) => {
    const updatedName = "Founder Updated"

    await dashboardPage.open()
    await expect(page).toHaveURL(/\/sign-in\?next=%2F/)
    await signInPage.expectLoaded()

    await signUpPage.open()
    await signUpPage.expectLoaded()
    await signUpPage.signUp(testUser)
    await dashboardPage.expectLoaded()

    await dashboardPage.reload()
    await dashboardPage.expectLoaded()

    await settingsPage.open()
    await settingsPage.expectLoaded()
    await settingsPage.expectEmail(testUser.email)
    await settingsPage.updateDisplayName(updatedName)
    await settingsPage.reload()
    await settingsPage.expectDisplayName(updatedName)

    await settingsPage.softDeleteAccount()
    await expect(page).toHaveURL(/\/sign-in/)
    await dashboardPage.open()
    await expect(page).toHaveURL(/\/sign-in/)

    await signInPage.signIn(testUser.email, testUser.password)
    await dashboardPage.expectLoaded()
  })

  test("authenticated fixture lands on dashboard", async ({
    authenticatedPage,
    testUser,
    settingsPage,
  }) => {
    await authenticatedPage.expectLoaded()
    await settingsPage.open()
    await settingsPage.expectEmail(testUser.email)
  })
})
