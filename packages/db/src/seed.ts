/**
 * Optional Phase 0 seed — no-op until DATABASE_URL is configured.
 * Run: pnpm --filter @pacepilot/db db:seed
 */
async function seed() {
  if (!process.env.DATABASE_URL) {
    console.log("Skipping seed: DATABASE_URL is not set.")
    return
  }

  console.log(
    "Seed placeholder ready. Add founder athlete fixtures when auth (0.2) lands."
  )
}

seed().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
