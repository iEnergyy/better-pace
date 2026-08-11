import path from "node:path"
import { fileURLToPath } from "node:url"
import { config as loadEnv } from "dotenv"

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
)
loadEnv({ path: path.join(rootDir, ".env") })

/**
 * Optional Phase 0 seed — founder fixtures can be added after auth is live.
 * Run: pnpm db:seed
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
