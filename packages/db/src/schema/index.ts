import {
  ACTIVITY_SOURCES,
  GOAL_METRICS,
  GOAL_STATUSES,
  INTENSITY_LABELS,
  PERSONAL_RECORD_KINDS,
  PERSONAL_RECORD_UNITS,
  PREFERRED_UNITS,
  SPORTS,
  STRAVA_SYNC_STATUSES,
  TRAINING_SUMMARY_PERIODS,
} from "@pacepilot/core"
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"
import { user } from "./auth"

export * from "./auth"

export const preferredUnitsEnum = pgEnum("preferred_units", PREFERRED_UNITS)

export const sportEnum = pgEnum("sport", SPORTS)

export const syncStatusEnum = pgEnum("strava_sync_status", STRAVA_SYNC_STATUSES)

export const goalStatusEnum = pgEnum("goal_status", GOAL_STATUSES)

export const goalMetricEnum = pgEnum("goal_metric", GOAL_METRICS)

export const activitySourceEnum = pgEnum("activity_source", ACTIVITY_SOURCES)

export const intensityLabelEnum = pgEnum("intensity_label", INTENSITY_LABELS)

export const trainingSummaryPeriodEnum = pgEnum(
  "training_summary_period",
  TRAINING_SUMMARY_PERIODS
)

export const personalRecordKindEnum = pgEnum(
  "personal_record_kind",
  PERSONAL_RECORD_KINDS
)

export const personalRecordUnitEnum = pgEnum(
  "personal_record_unit",
  PERSONAL_RECORD_UNITS
)

/**
 * Athlete profile persistence — maps to `@pacepilot/core` AthleteProfile.
 * 1:1 with Better Auth `user` (created on signup).
 */
export const athleteProfiles = pgTable("athlete_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  preferredUnits: preferredUnitsEnum("preferred_units")
    .notNull()
    .default("metric"),
  metricsRollup: jsonb("metrics_rollup"),
  metricsVersion: text("metrics_version"),
  metricsComputedAt: timestamp("metrics_computed_at", { withTimezone: true }),
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
  syncProgress: text("sync_progress"),
})

export const activities = pgTable(
  "activities",
  {
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
    calories: doublePrecision("calories"),
    averageSpeedMetersPerSecond: doublePrecision(
      "average_speed_meters_per_second"
    ),
    maxSpeedMetersPerSecond: doublePrecision("max_speed_meters_per_second"),
    rawData: jsonb("raw_data"),
    metricsVersion: text("metrics_version").notNull().default("activity.v1"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("activities_athlete_source_external_uid").on(
      table.athleteId,
      table.source,
      table.externalId
    ),
  ]
)

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

export const activityMetrics = pgTable(
  "activity_metrics",
  {
    activityId: uuid("activity_id")
      .primaryKey()
      .references(() => activities.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athleteProfiles.id),
    intensity: intensityLabelEnum("intensity").notNull(),
    intensityVersion: text("intensity_version").notNull(),
    sessionLoad: doublePrecision("session_load").notNull(),
    loadVersion: text("load_version").notNull(),
    hrMaxUsed: integer("hr_max_used"),
    estimated: boolean("estimated").notNull().default(false),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
)

export const trainingSummaries = pgTable(
  "training_summaries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athleteProfiles.id),
    period: trainingSummaryPeriodEnum("period").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    sessionCount: integer("session_count").notNull(),
    totalDurationSeconds: integer("total_duration_seconds").notNull(),
    totalDistanceMeters: doublePrecision("total_distance_meters").notNull(),
    totalLoad: doublePrecision("total_load").notNull(),
    bySport: jsonb("by_sport").notNull(),
    intensityCounts: jsonb("intensity_counts").notNull(),
    highIntensityCluster: boolean("high_intensity_cluster")
      .notNull()
      .default(false),
    volumeVersion: text("volume_version").notNull(),
    loadVersion: text("load_version").notNull(),
    computedAt: timestamp("computed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("training_summaries_athlete_period_start_uid").on(
      table.athleteId,
      table.period,
      table.periodStart
    ),
  ]
)

export const personalRecords = pgTable(
  "personal_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athleteProfiles.id),
    sport: sportEnum("sport").notNull(),
    kind: personalRecordKindEnum("kind").notNull(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    unit: personalRecordUnitEnum("unit").notNull(),
    estimated: boolean("estimated").notNull().default(false),
    achievedAt: timestamp("achieved_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("personal_records_athlete_sport_kind_uid").on(
      table.athleteId,
      table.sport,
      table.kind
    ),
  ]
)
