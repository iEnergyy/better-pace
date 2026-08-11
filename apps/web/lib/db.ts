import { createDbFromEnv } from "@pacepilot/db/client"

/**
 * Shared Drizzle client for the web app (auth + account mutations).
 * Uses DATABASE_URL from the environment (Neon pooled, for serverless).
 */
export const db = createDbFromEnv()
