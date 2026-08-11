import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/index"

export type Database = ReturnType<typeof createDb>

/**
 * Creates a Drizzle client. Use a Neon pooled connection string in
 * serverless via DATABASE_URL.
 */
export function createDb(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false, // required for many serverless poolers (PgBouncer)
    max: 10,
  })

  return drizzle(client, { schema })
}

export function createDbFromEnv(
  env: Record<string, string | undefined> = process.env
) {
  const url = env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is required to create a database client")
  }
  return createDb(url)
}
