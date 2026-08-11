import { Inngest } from "inngest"

/**
 * Background jobs scaffold (Inngest).
 * Wire event handlers for Strava sync / metrics in later Phase 0 workstreams.
 * Alternative considered: Trigger.dev — revisit if Inngest constraints appear.
 */
export const inngest = new Inngest({
  id: "pacepilot",
  name: "PacePilot",
})

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
