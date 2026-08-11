# PacePilot

> **Strava tells you what you did. PacePilot tells you what it means.**

PacePilot is an athlete intelligence platform that turns activity data into personalized insights.

The initial version connects to **Strava**, analyzes an athlete's activities across sports, identifies trends and patterns, and provides an AI interface for understanding training and performance.

The long-term vision is to become a **personal operating system for athletic performance**.

---

## Why PacePilot?

Athletes already have tons of data.

The problem is understanding it.

Strava can tell you:

> You ran 7.2 km at 6:21/km.

PacePilot should eventually be able to tell you:

> Your pace was slower than your recent average, but your heart rate was also lower. This doesn't look like a fitness regression. You may simply have run an easier effort.

And eventually:

> Your best running sessions tend to happen after a low-intensity day. You've had two high-intensity sessions in the last 48 hours, so an easy session today is probably a better choice.

The goal is:

**Data → Analytics → Intelligence → Coaching**

---

## Current Focus

The first data source is **Strava**.

Initial activities:

- Running
- Padel
- Cycling
- Swimming
- Walking
- Hiking
- Strength activities where sufficient data is available

Running receives the deepest sport-specific analysis initially.

Apple Health, Garmin, COROS, and other integrations are intentionally out of scope for the first version.

---

## Core Product

```text
                 STRAVA
                    │
                    ▼
            ┌───────────────┐
            │   DATA LAYER  │
            │ Activities    │
            │ Metrics       │
            │ History       │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ INTELLIGENCE  │
            │    ENGINE     │
            │ Trends        │
            │ Training Load │
            │ Patterns      │
            │ Performance   │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │   AI LAYER    │
            │ Explain       │
            │ Compare       │
            │ Answer        │
            │ Recommend     │
            └───────────────┘
```

---

## Core Features

### Athlete Profile

A continuously evolving representation of the athlete:

- Sports
- Training frequency
- Weekly volume
- Training load
- Consistency
- Performance trends
- Recovery trends
- Goals
- Personal records
- Historical patterns

### Unified Activity Timeline

All Strava activities in one normalized timeline.

### Cross-Sport Intelligence

PacePilot treats the athlete as a whole rather than analyzing each sport independently.

Example:

```text
Running       24 km
Padel          3 sessions
Swimming       1 session
Gym            2 sessions
```

The system can identify:

- Overall training load
- High-intensity clusters
- Changes in volume
- Training frequency
- Cross-sport relationships
- Historical patterns

### Running Intelligence

Running is the initial deep-analysis sport:

- Distance
- Pace
- Heart rate
- Cadence
- Elevation
- Long runs
- Easy runs
- Intervals
- Training frequency
- Pace trends
- Volume trends
- Race efforts
- Personal records

### Padel Intelligence

Focus on session-level physiological data:

- Duration
- Heart rate
- Maximum heart rate
- Calories
- Frequency
- Training load
- Historical trends

A future Padel Journal can capture subjective session feedback and compare it with objective data.

---

## AI — Ask My Data

Users can ask questions such as:

```text
Why am I getting slower?

Am I training too much?

How has my running improved?

Does playing padel affect my running?

What was my best training month?

Compare this month to last month.

Am I consistent?

What should I focus on?
```

AI responses must be grounded in the athlete's actual data.

---

## AI Architecture

The LLM should not directly analyze thousands of raw activities.

```text
Raw Activities
      ↓
Metrics Engine
      ↓
Aggregated Athlete State
      ↓
Historical Retrieval
      ↓
Question-Specific Context
      ↓
LLM
```

Deterministic systems calculate the numbers.

AI explains what those numbers mean.

---

## Roadmap

### Phase 0 — Personal Validation

Use PacePilot personally.

Goals:

- Validate Strava integration
- Validate data quality
- Validate metrics
- Identify useful insights
- Identify misleading insights
- Establish the baseline experience

### Phase 1 — Closed Beta

Target:

**10–50 athletes and coaches**

Initial community:

- Santo Domingo runners
- Padel players
- HYROX athletes
- Swimmers
- Cyclists
- Fitness enthusiasts
- Running coaches
- Personal trainers

The primary goal is validation, not revenue.

### Phase 2 — AI Analyst

Add:

- Ask My Data
- AI weekly reports
- Historical comparisons
- Goal analysis
- Personal patterns
- Deeper sport-specific intelligence

### Phase 3 — Open Beta

- Open registration
- Introduce optional paid features
- Test pricing
- Keep a useful free tier
- Give early beta users special benefits

### Phase 4 — Coach Platform

- Coach accounts
- Athlete invitations
- Coach dashboard
- Athlete monitoring
- Coach alerts
- Coach notes
- AI-generated coaching summaries

### Phase 5 — Additional Data Sources

Potential future integrations:

- Apple Health
- Garmin
- COROS
- Fitbit

### Phase 6 — Adaptive Coaching

Potential future capabilities:

- Training plans
- Workout recommendations
- Adaptive scheduling
- Recovery-aware recommendations
- Race preparation
- Multi-sport periodization

---

## Monetization

Pricing is intentionally undecided during the closed beta.

Potential models:

### Subscription

```text
Free
Basic analytics
Basic reports

Pro
Advanced intelligence
AI analysis
Historical patterns
Goals
```

### Credits / Insights

```text
Free
5 Insights/month

Plus
30 Insights/month

Power
100 Insights/month
```

Potential consumption:

```text
Simple question          1 Insight
Historical comparison    2 Insights
Deep training analysis   3 Insights
Full athlete assessment  5 Insights
```

### Hybrid

```text
Free
Basic analytics
5 Insights/month

Pro
Monthly subscription
50 Insights included

Additional Insights
Credit packs
```

The final model should be selected based on real beta usage.

---

## Dominican Republic Strategy

PacePilot is initially being developed with the Dominican fitness community in mind.

The Dominican Republic can function as the initial product laboratory without becoming the permanent geographic limitation.

Potential communities:

- Running clubs
- Padel communities
- Gyms
- HYROX communities
- Swimming groups
- Fitness creators
- Coaches
- Local races

Positioning:

> **Technology for smarter training in the Dominican Republic.**

---

## Competition

PacePilot does not need to replace Strava.

Strava is the initial data source.

```text
Strava
"What did I do?"

PacePilot
"What does it mean?"

Future PacePilot
"What should I do next?"
```

Long-term differentiation:

- Cross-sport intelligence
- Personal historical patterns
- Athlete-specific intelligence
- Longitudinal athlete models
- AI interaction with personal data
- Coach integrations

---

## Technology

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Hono
- TypeScript
- PostgreSQL
- Drizzle ORM

### Authentication

- Better Auth

### Background Jobs

- Inngest or Trigger.dev

### AI

- OpenAI

### Infrastructure

- Vercel
- Supabase or Neon

### External API

- Strava

---

## Monorepo layout

```text
better-pace/
├── apps/
│   ├── web/          # Next.js + Tailwind + shadcn/ui
│   └── api/          # Hono HTTP API (+ Inngest scaffold)
├── packages/
│   ├── core/         # Domain layer (entities, value objects)
│   ├── db/           # Drizzle schema, client, mappers → core
│   ├── ui/           # Shared shadcn components (@workspace/ui)
│   └── typescript-config/
├── biome.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Package manager: **pnpm**. Build orchestration: **Turborepo**.

Shared UI lives in `packages/ui`. Add components with:

```bash
pnpm dlx shadcn@latest add button -c packages/ui
```

Domain types live only in `@pacepilot/core`. Apps and `packages/db` import them — they do not redefine entities.

---

## Local development

**Requirements:** Node.js ≥ 20, [pnpm](https://pnpm.io) 10.x

```bash
pnpm install
cp .env.example .env                     # root — DATABASE_URL, BETTER_AUTH_*
cp .env.example apps/web/.env.local      # Next.js loads auth + DB from here
# Generate secret: openssl rand -base64 32 → BETTER_AUTH_SECRET (≥32 chars)
pnpm db:generate && pnpm db:migrate      # first-time / after schema changes
pnpm dev                                 # turbo: web (:3000) + api (:3001)
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start all apps via Turbo |
| `pnpm build` | Build the workspace |
| `pnpm typecheck` | TypeScript across packages |
| `pnpm lint` | Biome check (lint + format verify) |
| `pnpm format` | Biome check --write |
| `pnpm db:generate` | Drizzle migration generate |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema (dev) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm test:e2e` | Playwright e2e (`packages/e2e`, POM + fixtures) |

**Hello path:** open `http://localhost:3000` → redirects to `/sign-in` when logged out. After signup, dashboard loads. API: `http://localhost:3001/health` and `/sports`.

### E2E tests

Auth flows live in [`packages/e2e`](packages/e2e) (Playwright TypeScript, page objects + fixtures):

```bash
pnpm --filter @pacepilot/e2e exec playwright install chromium
pnpm test:e2e
```

`playwright.config.ts` reuses a running web app on `:3000`, or starts `pnpm --filter web dev` when needed.

### Database

Use **PostgreSQL** (Supabase or Neon). Prefer a **pooled** connection string for serverless (`DATABASE_URL`). Schema and migrations live in `packages/db` (Drizzle). Auth tables (`user`, `session`, `account`, `verification`) plus domain tables ship in the first migration.

### Auth / Strava / jobs

**Better Auth (0.2)** runs in `apps/web` (`/api/auth/*`, email/password). Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL=http://localhost:3000`. Signup creates a matching `athlete_profiles` row. Soft-delete on Settings marks the athlete profile deleted and signs out (full wipe in 0.8); the same credentials can still sign in afterward.

Strava OAuth (0.3) and richer Inngest handlers land next. Inngest is scaffolded at `apps/api` (`/api/inngest`).

### Vercel

`vercel.json` targets the Next.js app (`apps/web`). Point env vars at a non-prod database for preview deployments. Deploy the Hono API as a separate Vercel project or Node service when you leave local-only.

---

## Architecture

```text
                      Strava API
                          │
                          ▼
                  ┌───────────────┐
                  │ Sync Service  │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ PostgreSQL    │
                  │ Activities    │
                  │ Connections   │
                  │ Athlete Data  │
                  └───────┬───────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Metrics Engine│
                  └───────┬───────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
         Sport Analysis       Training Engine
                │                   │
                └─────────┬─────────┘
                          ▼
                  Athlete Profile
                          │
                          ▼
                  Intelligence API
                          │
               ┌──────────┴──────────┐
               ▼                     ▼
           Web Application        AI Layer
               │                     │
               └──────────┬──────────┘
                          ▼
                    Athlete / Coach
```

---

## Data Model

Core entities:

```text
User
  │
  ├── AthleteProfile
  ├── StravaConnection
  ├── Goal[]
  └── Activity[]
```

Future:

```text
Coach
  │
  └── AthleteRelationship[]
```

Additional entities:

- ActivityMetric
- TrainingSummary
- AthleteInsight
- WeeklyReport
- PersonalRecord
- AthletePattern
- CoachNote

---

## MVP Success Criteria

The MVP succeeds if:

1. A user can connect Strava easily.
2. Historical activities import reliably.
3. Activities are normalized across sports.
4. The system generates useful athlete-level insights.
5. Users understand insights they couldn't easily derive from Strava.
6. Users return to check their training.
7. Athletes and coaches request additional functionality.

The most important signal is:

> **"I already had this data in Strava, but I couldn't see this."**

---

## North Star Metric

**Useful Insights per Active Athlete**

The core validation question:

> **How often does PacePilot provide an athlete with a useful insight that they could not easily derive from Strava themselves?**

---

## Long-Term Vision

PacePilot should eventually become a personal operating system for athletic performance.

```text
                     ATHLETE
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Running        Padel        Swimming
          │             │             │
          └─────────────┼─────────────┘
                        ▼
                  Athlete Data
                        │
                        ▼
                Athlete Intelligence
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       Performance   Recovery    Training
            │           │           │
            └───────────┼───────────┘
                        ▼
                     AI Coach
                        │
                  ┌─────┴─────┐
                  ▼           ▼
               Athlete      Coach
```

**Strategic sequence:**

**Strava Integration → Athlete Intelligence → AI Analyst → Coach Platform → Multi-source Athlete OS → AI Coach**
