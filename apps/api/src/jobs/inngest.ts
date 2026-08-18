import { inngest } from "./client"

/**
 * Background jobs scaffold (Inngest).
 * Strava sync runs in Next.js for Phase 0 founder dogfood — Inngest workers deferred.
 */
export { inngest } from "./client"

export const helloJob = inngest.createFunction(
  { id: "foundation-hello", name: "Foundation hello" },
  { event: "pacepilot/foundation.hello" },
  async ({ event, step }) => {
    await step.run("log-hello", async () => {
      console.log("Inngest foundation hello", event.data)
    })
    return { ok: true as const }
  }
)

export const functions = [helloJob]
