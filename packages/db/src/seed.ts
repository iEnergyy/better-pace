/**
 * Optional Phase 0 seed — founder fixtures can be added after auth is live.
 * Run: pnpm --filter @pacepilot/db db:seed
 */
async function seed() {
  if (!process.env.DATABASE_URL) {
    console.log("Skipping seed: DATABASE_URL is not set.")
    return
  }

  console.log(
    "Seed placeholder ready. Prefer signing up via the web app for Phase 0."
  )
}

seed().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
