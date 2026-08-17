# Metrics methodology (Phase 0.5)

Deterministic, versioned calculations. **Not medical advice** and not a clinical training-load product.

Bundle version: `metrics.bundle.v1`

## Volume (`volume.v1`)

- Distance sports (running, cycling, swimming, walking, hiking): primary volume is meters; duration always stored.
- Duration sports (padel, strength, other): primary volume is duration; distance included only when present.
- Period totals include `totalDurationSeconds` (total training exposure) and `totalDistanceMeters` (distance sports only).
- Windows: ISO week (athlete timezone) and calendar month.

## Intensity (`intensity.v1`)

Labels: `easy` | `moderate` | `hard` | `unknown`

Signal priority:

1. **Heart rate** when `averageHeartRate` is present  
   - `hrMax` = rolling 90-day max of activity `maxHeartRate`  
   - Fallback: current activity `maxHeartRate`, then `190`  
   - Easy < 70% HRmax · Moderate 70–84% · Hard ≥ 85%
2. **Pace proxy** for running/cycling/swimming vs 28-day median pace (±12%)
3. Strava `suffer_score` / perceived exertion in `rawData` when present
4. Otherwise **`unknown`** (never silently labeled moderate)

## Training load (`load.v1`)

```text
sessionLoad = durationMinutes × intensityFactor × sportFactor
```

| Intensity | Factor |
| --- | --- |
| easy | 1.0 |
| moderate | 1.5 |
| hard | 2.5 |
| unknown | 1.2 |

Sport factors: running 1.0, cycling 0.9, swimming 1.1, padel 1.2, strength 0.8, walking/hiking 0.7, other 1.0.

High-intensity cluster: ≥3 hard sessions in any rolling 7 local days.

## Personal records

Running 1K/5K/10K may be **estimated** from average pace when activity distance ≥ target (flagged `estimated`). Prefer real splits later when streams exist.

## Recompute

- After historical Strava import → full recompute  
- After Update (recent sync) → recompute (full history for rolling windows; founder scale)  
- Insights **Recompute all metrics** → full recompute without re-import

## Validation

Log misleading labels or totals in [validation-notes.md](./validation-notes.md) during dogfood.
