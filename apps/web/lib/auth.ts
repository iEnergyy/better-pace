import * as schema from "@pacepilot/db/schema"
import { athleteProfiles } from "@pacepilot/db/schema"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(athleteProfiles).values({
            userId: user.id,
            displayName:
              user.name?.trim() || user.email.split("@")[0] || "Athlete",
            timezone: "UTC",
            preferredUnits: "metric",
          })
        },
      },
    },
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
