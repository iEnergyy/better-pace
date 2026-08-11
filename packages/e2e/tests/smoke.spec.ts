import { expect, test } from "../fixtures"

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"

test.describe("smoke", () => {
  test("api health responds ok", async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/health`)
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body).toMatchObject({
      data: {
        status: "ok",
        service: "pacepilot-api",
      },
    })
  })

  test("sign up → dashboard → sign out → sign in", async ({
    page,
    signInPage,
    signUpPage,
    dashboardPage,
    testUser,
  }) => {
    await dashboardPage.open()
    await expect(page).toHaveURL(/\/sign-in\?next=%2F/)
    await signInPage.expectLoaded()

    await signUpPage.open()
    await signUpPage.expectLoaded()
    await signUpPage.signUp(testUser)
    await dashboardPage.expectLoaded()

    await dashboardPage.reload()
    await dashboardPage.expectLoaded()

    await dashboardPage.signOut()
    await signInPage.expectLoaded()

    await signInPage.signIn(testUser.email, testUser.password)
    await dashboardPage.expectLoaded()
  })
})
