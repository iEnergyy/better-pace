import type { Activity } from "../entities/activity"
import type { ActivityId, AthleteId } from "../entities/ids"
import { ymdKey, zonedYmd } from "./period"
import type {
  PersonalRecord,
  PersonalRecordKind,
  PersonalRecordUnit,
} from "./types"

type ActivityLoad = { activity: Activity; sessionLoad: number }

const RUN_1K = 1000
const RUN_5K = 5000
const RUN_10K = 10_000
const MIN_CYCLE_DISTANCE = 5000
const MIN_SWIM_DISTANCE = 200

function estimatedSplitSeconds(
  distanceMeters: number,
  paceSecondsPerKm: number,
  targetMeters: number
): number | null {
  if (distanceMeters < targetMeters) return null
  if (paceSecondsPerKm <= 0) return null
  return (paceSecondsPerKm / 1000) * targetMeters
}

function consider(
  map: Map<string, PersonalRecord>,
  record: Omit<PersonalRecord, "athleteId"> & { athleteId: AthleteId },
  better: (next: number, prev: number) => boolean
) {
  const key = `${record.sport}:${record.kind}`
  const prev = map.get(key)
  if (!prev || better(record.value, prev.value)) {
    map.set(key, record)
  }
}

function lowerIsBetter(next: number, prev: number) {
  return next < prev
}

function higherIsBetter(next: number, prev: number) {
  return next > prev
}

/**
 * Detect PRs from available activity fields. Distance split PRs are estimated
 * from average pace when activity distance ≥ target (flagged estimated).
 */
export function detectPersonalRecords(
  athleteId: AthleteId,
  items: ActivityLoad[]
): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>()

  for (const { activity, sessionLoad } of items) {
    const id = activity.id as ActivityId

    if (activity.sport === "running") {
      if (activity.distanceMeters != null && activity.distanceMeters > 0) {
        consider(
          map,
          {
            athleteId,
            sport: "running",
            kind: "longest_distance",
            activityId: id,
            value: activity.distanceMeters,
            unit: "meters",
            estimated: false,
            achievedAt: activity.startedAt,
          },
          higherIsBetter
        )
      }

      if (
        activity.averagePaceSecondsPerKm != null &&
        activity.distanceMeters != null
      ) {
        const targets: {
          kind: PersonalRecordKind
          meters: number
        }[] = [
          { kind: "fastest_1k", meters: RUN_1K },
          { kind: "fastest_5k", meters: RUN_5K },
          { kind: "fastest_10k", meters: RUN_10K },
        ]
        for (const t of targets) {
          const seconds = estimatedSplitSeconds(
            activity.distanceMeters,
            activity.averagePaceSecondsPerKm,
            t.meters
          )
          if (seconds == null) continue
          consider(
            map,
            {
              athleteId,
              sport: "running",
              kind: t.kind,
              activityId: id,
              value: Math.round(seconds * 10) / 10,
              unit: "seconds",
              estimated: true,
              achievedAt: activity.startedAt,
            },
            lowerIsBetter
          )
        }
      }
    }

    if (activity.sport === "cycling") {
      if (activity.distanceMeters != null && activity.distanceMeters > 0) {
        consider(
          map,
          {
            athleteId,
            sport: "cycling",
            kind: "longest_distance",
            activityId: id,
            value: activity.distanceMeters,
            unit: "meters",
            estimated: false,
            achievedAt: activity.startedAt,
          },
          higherIsBetter
        )
      }
      if (
        activity.distanceMeters != null &&
        activity.distanceMeters >= MIN_CYCLE_DISTANCE &&
        activity.averageSpeedMetersPerSecond != null &&
        activity.averageSpeedMetersPerSecond > 0
      ) {
        consider(
          map,
          {
            athleteId,
            sport: "cycling",
            kind: "fastest_ride",
            activityId: id,
            value: activity.averageSpeedMetersPerSecond,
            unit: "meters_per_second",
            estimated: false,
            achievedAt: activity.startedAt,
          },
          higherIsBetter
        )
      }
    }

    if (activity.sport === "swimming") {
      if (activity.distanceMeters != null && activity.distanceMeters > 0) {
        consider(
          map,
          {
            athleteId,
            sport: "swimming",
            kind: "longest_distance",
            activityId: id,
            value: activity.distanceMeters,
            unit: "meters",
            estimated: false,
            achievedAt: activity.startedAt,
          },
          higherIsBetter
        )
      }
      if (
        activity.distanceMeters != null &&
        activity.distanceMeters >= MIN_SWIM_DISTANCE &&
        activity.averagePaceSecondsPerKm != null &&
        activity.averagePaceSecondsPerKm > 0
      ) {
        consider(
          map,
          {
            athleteId,
            sport: "swimming",
            kind: "fastest_distance",
            activityId: id,
            value: activity.averagePaceSecondsPerKm,
            unit: "seconds",
            estimated: true,
            achievedAt: activity.startedAt,
          },
          lowerIsBetter
        )
      }
    }

    if (activity.sport === "padel") {
      consider(
        map,
        {
          athleteId,
          sport: "padel",
          kind: "longest_duration",
          activityId: id,
          value: activity.durationSeconds,
          unit: "seconds",
          estimated: false,
          achievedAt: activity.startedAt,
        },
        higherIsBetter
      )
      if (activity.averageHeartRate != null && activity.averageHeartRate > 0) {
        consider(
          map,
          {
            athleteId,
            sport: "padel",
            kind: "highest_avg_hr",
            activityId: id,
            value: activity.averageHeartRate,
            unit: "bpm",
            estimated: false,
            achievedAt: activity.startedAt,
          },
          higherIsBetter
        )
      }
      consider(
        map,
        {
          athleteId,
          sport: "padel",
          kind: "highest_session_load",
          activityId: id,
          value: sessionLoad,
          unit: "load",
          estimated: false,
          achievedAt: activity.startedAt,
        },
        higherIsBetter
      )
    }
  }

  return [...map.values()]
}

export function hardSessionLocalDayKeys(
  items: ActivityLoad[],
  intensities: Map<string, import("./types").IntensityLabel>,
  timeZone: string
): string[] {
  const keys: string[] = []
  for (const { activity } of items) {
    if (intensities.get(activity.id) !== "hard") continue
    keys.push(ymdKey(zonedYmd(activity.startedAt, timeZone)))
  }
  return keys
}

export type { PersonalRecordUnit }
