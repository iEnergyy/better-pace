import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const preferredUnitsEnum = pgEnum("preferred_units", [
  "metric",
  "imperial",
])

export const sportEnum = pgEnum("sport", [
  "running",
  "padel",
  "cycling",
  "swimming",
  "walking",
  "hiking",
  "strength",
  "other",
])

export const syncStatusEnum = pgEnum("strava_sync_status", [
  "idle",
  "importing",
  "synced",
  "error",
])

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "abandoned",
])

export const goalMetricEnum = pgEnum("goal_metric", [
  "weekly_distance_meters",
  "weekly_duration_seconds",
  "weekly_activity_count",
  "target_pace_seconds_per_km",
])

export const activitySourceEnum = pgEnum("activity_source", ["strava"])

/**
 * Athlete profile persistence — maps to `@pacepilot/core` AthleteProfile.
 * Auth user table arrives with Better Auth in phase 0.2; userId is a string FK for now.
 */
export const athleteProfiles = pgTable("athlete_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  preferredUnits: preferredUnitsEnum("preferred_units")
    .notNull()
    .default("metric"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
})

export const stravaConnections = pgTable("strava_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athleteProfiles.id)
    .unique(),
  stravaAthleteId: text("strava_athlete_id").notNull().unique(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scopes: text("scopes").array().notNull().default([]),
  syncStatus: syncStatusEnum("sync_status").notNull().default("idle"),
  connectedAt: timestamp("connected_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  disconnectedAt: timestamp("disconnected_at", { withTimezone: true }),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
})

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athleteProfiles.id),
  source: activitySourceEnum("source").notNull().default("strava"),
  externalId: text("external_id").notNull(),
  sport: sportEnum("sport").notNull(),
  name: text("name").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  distanceMeters: doublePrecision("distance_meters"),
  elevationGainMeters: doublePrecision("elevation_gain_meters"),
  averageHeartRate: integer("average_heart_rate"),
  maxHeartRate: integer("max_heart_rate"),
  averagePaceSecondsPerKm: doublePrecision("average_pace_seconds_per_km"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  athleteId: uuid("athlete_id")
    .notNull()
    .references(() => athleteProfiles.id),
  sport: sportEnum("sport"),
  title: text("title").notNull(),
  metric: goalMetricEnum("metric").notNull(),
  targetValue: doublePrecision("target_value").notNull(),
  status: goalStatusEnum("status").notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
