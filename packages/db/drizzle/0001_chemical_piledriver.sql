ALTER TABLE "activities" ADD COLUMN "calories" double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "average_speed_meters_per_second" double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "max_speed_meters_per_second" double precision;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "raw_data" jsonb;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "metrics_version" text DEFAULT 'activity.v1' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_athlete_source_external_uid" ON "activities" USING btree ("athlete_id","source","external_id");