CREATE TYPE "public"."intensity_label" AS ENUM('easy', 'moderate', 'hard', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."personal_record_kind" AS ENUM('fastest_1k', 'fastest_5k', 'fastest_10k', 'longest_distance', 'fastest_ride', 'fastest_distance', 'longest_duration', 'highest_avg_hr', 'highest_session_load');--> statement-breakpoint
CREATE TYPE "public"."personal_record_unit" AS ENUM('seconds', 'meters', 'bpm', 'load', 'meters_per_second');--> statement-breakpoint
CREATE TYPE "public"."training_summary_period" AS ENUM('week', 'month');--> statement-breakpoint
CREATE TABLE "activity_metrics" (
	"activity_id" uuid PRIMARY KEY NOT NULL,
	"athlete_id" uuid NOT NULL,
	"intensity" "intensity_label" NOT NULL,
	"intensity_version" text NOT NULL,
	"session_load" double precision NOT NULL,
	"load_version" text NOT NULL,
	"hr_max_used" integer,
	"estimated" boolean DEFAULT false NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"sport" "sport" NOT NULL,
	"kind" "personal_record_kind" NOT NULL,
	"activity_id" uuid NOT NULL,
	"value" double precision NOT NULL,
	"unit" "personal_record_unit" NOT NULL,
	"estimated" boolean DEFAULT false NOT NULL,
	"achieved_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"period" "training_summary_period" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"session_count" integer NOT NULL,
	"total_duration_seconds" integer NOT NULL,
	"total_distance_meters" double precision NOT NULL,
	"total_load" double precision NOT NULL,
	"by_sport" jsonb NOT NULL,
	"intensity_counts" jsonb NOT NULL,
	"high_intensity_cluster" boolean DEFAULT false NOT NULL,
	"volume_version" text NOT NULL,
	"load_version" text NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD COLUMN "metrics_rollup" jsonb;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD COLUMN "metrics_version" text;--> statement-breakpoint
ALTER TABLE "athlete_profiles" ADD COLUMN "metrics_computed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "activity_metrics" ADD CONSTRAINT "activity_metrics_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_metrics" ADD CONSTRAINT "activity_metrics_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_records" ADD CONSTRAINT "personal_records_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_summaries" ADD CONSTRAINT "training_summaries_athlete_id_athlete_profiles_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "personal_records_athlete_sport_kind_uid" ON "personal_records" USING btree ("athlete_id","sport","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "training_summaries_athlete_period_start_uid" ON "training_summaries" USING btree ("athlete_id","period","period_start");