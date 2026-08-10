# PacePilot — Implementation Roadmap

**Status:** Pre-build  
**Based on:** [README.md](./README.md), [PRD.md](./PRD.md)  
**North star:** Useful Insights per Active Athlete  
**Architecture:** Turborepo monorepo · domain models in `packages/core` (DDD domain layer)  
**Strategic sequence:** Strava Integration → Athlete Intelligence → AI Analyst → Coach Platform → Multi-source Athlete OS → AI Coach

---

## How to use this document

Each phase lists:

1. **Goal** — why this phase exists  
2. **Outcomes** — what must be true when the phase ends  
3. **Workstreams** — detailed implementation work  
4. **Acceptance criteria** — how we know it’s done  
5. **Exit metrics** — product signals before moving on  
6. **Explicitly deferred** — what not to build yet  

Build in order. Do not start a later phase until the current phase’s acceptance criteria are met (unless noted as parallelizable).

**MVP success test (from PRD):**

> “I already had this data in Strava, but I couldn’t see this.”

---

## Phase overview

| Phase | Name | Primary audience | Build focus |
| --- | --- | --- | --- |
| **0** | Foundation & personal validation | Founder only | Stack, auth, Strava sync, metrics, personal dashboard |
| **1** | Closed beta MVP | 10–50 athletes/coaches | Multi-user polish, insights, goals, invite flow |
| **2** | AI Analyst | Closed beta users | Ask My Data, weekly AI reports, patterns |
| **3** | Open beta & monetization experiments | Open registration | Pricing tests, free/pro boundaries, scale |
| **4** | Coach platform | Coaches + athletes | Relationships, coach dashboard, alerts, notes |
| **5** | Additional data sources | Validated demand | Apple Health / Garmin / COROS / Fitbit |
| **6** | Adaptive coaching | Pro athletes & coaches | Plans, recommendations, periodization |

---

## Architecture decisions (locked)

These are fixed for implementation unless we explicitly revisit them.

### Turborepo monorepo

PacePilot is a **Turborepo monorepo**. Apps and packages share one repo, one toolchain, and Turbo pipelines for build/lint/test/dev.

```text
better-pace/
├── apps/
│   ├── web/          # Next.js (UI)
│   └── api/          # Hono (HTTP API + workers entry as needed)
├── packages/
│   ├── core/         # Domain layer — entities, value objects, domain rules
│   ├── db/           # Drizzle schema, migrations, DB client (depends on core)
│   └── …             # Future: ui, config, typescript-config, etc.
├── turbo.json
├── package.json
└── …
```

### `packages/core` — domain layer

Core domain models and business meaning live in **`packages/core`**, not inside the web or API apps.

This follows **Domain-Driven Design (DDD)**: a framework-agnostic **domain layer** (sometimes called the domain model / shared kernel when consumed by multiple apps).

**`packages/core` owns:**

- Domain entities & aggregates (e.g. `Activity`, `AthleteProfile`, `Goal`, `PersonalRecord`)
- Value objects (e.g. sport types, pace, training load version identifiers)
- Domain types / enums / invariants
- Pure domain functions & calculation contracts (metrics interfaces, sport classification rules)
- Shared domain errors / result types where useful

**`packages/core` does not own:**

- React components or Next.js routes
- Hono handlers or HTTP DTOs (map at the API boundary)
- Drizzle table definitions or SQL (those live in `packages/db`, which maps DB ↔ core)
- Strava/OpenAI client code (adapters/infrastructure in apps or infra packages)
- Environment/config secrets

**Rule:** If something is a core product concept (“what is an Activity?”), it belongs in `core` first. Apps import from `@pacepilot/core` (or the chosen package name); they do not redefine domain shapes.

```text
apps/web  ──imports──►  packages/core
apps/api  ──imports──►  packages/core
packages/db ──imports──►  packages/core   (persistence maps to domain)
```

---

# Phase 0 — Foundation & Personal Validation

**Goal:** Build a working product you can use daily on your own Strava data. Validate that sync, metrics, and insights are trustworthy before inviting anyone else.

**Duration target:** Until you personally trust the numbers and return to the app without prompting.

---

## 0.1 Project foundation

### Outcomes

- **Turborepo monorepo** is bootstrapped and runnable locally + on Vercel.
- `packages/core` exists as the DDD domain layer for entities/models.
- Apps (`web`, `api`) and `db` consume core types instead of duplicating them.
- Environment config, secrets, and local DB workflow documented.

### Implement

**Monorepo (Turborepo)**

- [ ] Initialize Turborepo workspace (`turbo.json`, root `package.json`, workspaces)
- [ ] Create apps: `apps/web`, `apps/api`
- [ ] Create packages: `packages/core`, `packages/db` (and shared `typescript-config` / lint config as needed)
- [ ] Turbo pipelines for `dev`, `build`, `lint`, `typecheck`, `test`
- [ ] TypeScript strict mode across packages
- [ ] ESLint + Prettier (or Biome), hoisted via workspace
- [ ] `.env.example` with all required keys
- [ ] README setup instructions (Turbo, local DB, Strava app, auth secrets)

**`packages/core` (domain layer)**

- [ ] Package scaffold exporting domain modules (e.g. `entities/`, `value-objects/`, `sports/`, `errors/`)
- [ ] Initial entity stubs aligned to PRD: `Activity`, `AthleteProfile`, `StravaConnection`, `Goal` (minimal shapes OK)
- [ ] Sport enum / classification types (Running, Padel, Cycling, Swimming, Walking, Hiking, Strength, Other)
- [ ] No framework imports in `core` (no React, Hono, Drizzle, Next)

**Frontend (`apps/web`)**

- [ ] Next.js + TypeScript + Tailwind CSS
- [ ] shadcn/ui base setup
- [ ] App shell: layout, navigation placeholders, loading/empty/error states
- [ ] Design tokens / CSS variables aligned to product (avoid generic default look)
- [ ] Import domain types from `@pacepilot/core` (or chosen package name) only — do not redefine entities in the UI

**Backend (`apps/api`)**

- [ ] Hono API app in the monorepo
- [ ] Health check endpoint
- [ ] Request logging / error handling middleware
- [ ] Typed API responses; map HTTP DTOs ↔ `core` domain types at the boundary

**Database (`packages/db`)**

- [ ] PostgreSQL (Supabase or Neon)
- [ ] Drizzle ORM schema + migrations workflow
- [ ] Schema maps persistence ↔ `packages/core` entities
- [ ] Seed script (optional for Phase 0)

**Infrastructure**

- [ ] Vercel project(s) wired for preview + production (monorepo-aware)
- [ ] Database connection pooling for serverless
- [ ] Background jobs provider chosen and scaffolded (**Inngest or Trigger.dev**)

### Acceptance criteria

- `turbo dev` (or documented root script) starts cleanly
- `packages/core` builds and is importable from `web` and `api`
- Deployed preview environment connects to a non-prod database
- One end-to-end “hello” path works (e.g. health + empty authenticated page)

---

## 0.2 Authentication & account

### Outcomes

- A user can register/sign in and own an athlete identity in the database.

### Implement

**Auth (Better Auth)**

- [ ] Email/password and/or magic link (pick one primary for Phase 0)
- [ ] Session management
- [ ] Protected API routes / middleware
- [ ] Sign up, sign in, sign out UI
- [ ] Account settings shell (profile display name, email)

**Data model** (`packages/core`)

```text
User
  └── AthleteProfile (1:1, created on signup)
```

- [ ] `User` table (via Better Auth schema + app fields)
- [ ] `AthleteProfile` domain type in `packages/core` + Drizzle mapping in `packages/db` (minimal: displayName, timezone, preferred units, createdAt)
- [ ] Soft delete / account deletion stub (full deletion in 0.8)

### Acceptance criteria

- Founder can create an account and stay signed in across refresh
- Unauthenticated users cannot access dashboard routes

---

## 0.3 Strava connection

### Outcomes

- Secure OAuth to Strava; tokens stored encrypted; disconnect works.

### Implement

**Strava app setup**

- [ ] Create Strava API application
- [ ] Configure callback URLs for local + deployed envs
- [ ] Request scopes needed for activity read (+ athlete profile as required)

**OAuth flow**

```text
User → Connect Strava → Strava auth → Callback → Store tokens → Trigger import
```

- [ ] `StravaConnection` entity:
  - athleteId / userId
  - stravaAthleteId
  - accessToken (encrypted)
  - refreshToken (encrypted)
  - expiresAt
  - scopes
  - connectedAt / disconnectedAt
  - syncStatus (`idle` | `importing` | `synced` | `error`)
- [ ] Token refresh helper (before API calls / on 401)
- [ ] Connect button + status UI
- [ ] Disconnect flow (revoke locally; clear tokens; decide whether to keep/delete activities — document choice)
- [ ] Rate-limit awareness helpers (Strava limits)

### Acceptance criteria

- Founder connects personal Strava successfully
- Tokens never appear in logs or client responses
- Disconnect removes authorization and updates UI state

---

## 0.4 Activity sync & normalization

### Outcomes

- Historical import + ongoing sync produce a reliable unified activity timeline.

### Implement

**Background jobs**

- [ ] Job: `strava.import.historical` (paginated activity list fetch)
- [ ] Job: `strava.sync.recent` (incremental / webhook or poll)
- [ ] Job: `strava.activity.detail` (fetch detailed activity when list payload is insufficient)
- [ ] Job progress events for UI (imported count / total estimate)
- [ ] Idempotent upserts by `(source, sourceActivityId)`

**Webhook (preferred) or polling**

- [ ] Strava webhook subscription endpoint (validation + event handling) **or**
- [ ] Scheduled poll for new/updated activities (acceptable for Phase 0 if webhooks delayed)

**Unified Activity model** (define in `packages/core`, persist via `packages/db`)

```text
Activity {
  id, athleteId, source, sourceActivityId,
  sport, startedAt, duration,
  distance, elevationGain,
  averageHeartRate, maxHeartRate, calories,
  averageSpeed, maxSpeed,
  rawData, createdAt, updatedAt
}
```

- [ ] Domain `Activity` + sport-specific value objects/types in `packages/core`
- [ ] Sport mapping from Strava types → internal sports:
  - Running, Padel, Cycling, Swimming, Walking, Hiking, Strength, Other
- [ ] Sport-specific metric extensions in `core`:
  - `RunningMetrics` (pace, cadence, GAP if available)
  - `PadelMetrics` (duration, HR, calories)
  - `SwimmingMetrics` (distance, duration, pace)
- [ ] Preserve `rawData` for reprocessing without re-fetch when possible
- [ ] Reprocess pipeline version field (`metricsVersion`)

**Import UX**

- [ ] Progress screen during historical import
- [ ] Empty state before first sync
- [ ] Error state with retry

### Acceptance criteria

- Full personal history imports without silent drops
- Re-running import does not duplicate activities
- Timeline shows activities across multiple sports
- New Strava activity appears in PacePilot within an acceptable window (document target: e.g. &lt; 15 min via poll, or near-real-time via webhook)

---

## 0.5 Metrics engine (deterministic)

### Outcomes

- Algorithms calculate volume, frequency, intensity, load, PRs, and trends — AI is not used yet for numbers.

### Implement

**Core calculations (versioned)**

- [ ] Daily / weekly / monthly training volume
  - By sport and total
  - Distance-based sports vs duration-based sports (padel/strength)
- [ ] Training frequency (sessions per week / streak / consistency score)
- [ ] Intensity classification: Easy / Moderate / Hard
  - Transparent rules (HR zones if available, else pace/relative effort proxies)
  - Document methodology + version (`intensity.v1`)
- [ ] Training load (internal metric)
  - Transparent, deterministic, versioned (`load.v1`)
  - Explicit disclaimer: not a medical measurement
- [ ] High-intensity clusters / consecutive hard days
- [ ] Fitness / recovery / performance trend placeholders (simple moving windows for Phase 0)
- [ ] Personal records:
  - Running: fastest 1K / 5K / 10K, longest run
  - Cycling: fastest / longest
  - Swimming: longest / fastest where data permits
  - Padel: longest session, highest HR, highest session load

**Derived entities**

- [ ] `ActivityMetric`
- [ ] `TrainingSummary` (week / month)
- [ ] `PersonalRecord`
- [ ] `AthleteProfile` rollups refreshed after sync

**Athlete profile fields to populate**

- sports, trainingFrequency, weeklyVolume, trainingLoad
- consistencyScore, fitnessTrend, recoveryTrend, performanceTrend
- personalRecords

### Acceptance criteria

- Spot-check 20+ personal activities against Strava numbers (distance, duration, HR)
- Weekly totals match manual expectation within documented tolerance
- Intensity labels feel sane for known easy/hard sessions
- Misleading metrics are logged in a “validation notes” list for Phase 1 fixes

---

## 0.6 Athlete dashboard & timeline (no AI yet)

### Outcomes

- Home screen answers “How am I doing?” using deterministic insights only.

### Implement

**Dashboard (“Good morning” view)**

- [ ] This week: training load, consistency, fitness/recovery trends
- [ ] Activity count, total training time, sports touched
- [ ] Rule-based insight cards (templates, not LLM), e.g.:
  - Volume up/down vs last week
  - High-intensity cluster warning
  - Cross-sport load note (running km looks low but total load is high because of padel)
- [ ] Units: km / mi preference

**Activity timeline**

- [ ] Chronological list
- [ ] Filters: sport, date range, intensity, duration
- [ ] Activity detail page (core metrics + sport-specific fields)

**Summaries**

- [ ] Weekly summary page
- [ ] Monthly summary page

**Running intelligence (deepest for V1)**

- [ ] Pace trends, volume trends
- [ ] Easy vs hard / long-run identification (heuristic)
- [ ] Basic PR highlighting

**Padel intelligence (physiological only)**

- [ ] Duration, HR, calories, frequency, load, trends
- [ ] No fake match-score claims

### Acceptance criteria

- Founder can understand the week without opening Strava
- At least 3 insight types regularly feel useful
- Cross-sport view is visibly more informative than single-sport Strava charts

---

## 0.7 Privacy & data ownership (baseline)

### Implement

- [ ] Encrypted token storage at rest
- [ ] Disconnect Strava
- [ ] Delete account + cascade delete athlete data (or documented soft-delete + purge job)
- [ ] No public sharing surfaces in Phase 0
- [ ] Copy: no medical/injury diagnosis claims

### Acceptance criteria

- Disconnect and delete paths verified on a secondary test account

---

## 0.8 Phase 0 exit

### Exit checklist

- [ ] Personal Strava connected and historical import complete
- [ ] Metrics trusted enough for daily use
- [ ] Useful vs misleading insights documented
- [ ] Baseline UX notes for closed beta onboarding
- [ ] Known Strava quirks documented (missing HR, indoor runs, padel mapping, etc.)

### Exit metrics (qualitative)

- You return to PacePilot at least weekly without forcing it
- You can point to insights that were not obvious in Strava

### Explicitly deferred from Phase 0

- Multi-user invites, coach features, payments, Ask My Data LLM, goals UI polish, Padel Journal, mobile apps, extra wearables

---

# Phase 1 — Closed Beta MVP

**Goal:** Make the product safe and useful for **10–50** athletes and coaches in the Dominican Republic community. Validation over revenue.

**Primary communities:** Santo Domingo runners, padel players, HYROX athletes, swimmers, cyclists, fitness enthusiasts, running coaches, personal trainers.

---

## 1.1 Multi-user readiness

### Implement

- [ ] Production auth hardening (rate limits, email verification if using email)
- [ ] Invite-only access (invite codes / allowlist)
- [ ] Onboarding checklist:
  1. Create account
  2. Connect Strava
  3. Wait for import
  4. See first dashboard insight
- [ ] Import progress that works for large histories
- [ ] Support / feedback channel (Form, Discord, WhatsApp group — pick one)
- [ ] Basic analytics events (onboarding steps, connect success/fail, weekly return)

### Acceptance criteria

- New invitee can go from invite → first insight without founder help
- Failures during Strava connect are recoverable with clear messaging

---

## 1.2 Intelligence completeness for MVP

Complete remaining PRD MVP analytics that may have been thin in Phase 0:

- [ ] Intensity analysis UI (easy/moderate/hard distribution, consecutive hard days)
- [ ] Cross-sport intelligence cards (frequency, load interference examples)
- [ ] Trend analysis over 4 / 8 / 12 weeks
- [ ] Personal records page
- [ ] Training load explanation (“how we calculate this”, versioned)
- [ ] Consistency score definition + display

### Acceptance criteria

Product answers the five MVP questions well:

1. What did I actually do?  
2. How am I progressing?  
3. Am I training too much or too little?  
4. What patterns exist in my training?  
5. What does all this mean? *(rule-based explanations now; LLM in Phase 2)*

---

## 1.3 Goals

### Implement

- [ ] `Goal` entity: type, title, target date, target metric, sport (optional), status
- [ ] Goal types for V1:
  - Race time (e.g. sub-30 5K)
  - Event completion (HYROX)
  - Volume target (e.g. 500 km/year)
- [ ] Progress tracking against available data
- [ ] Goal card on dashboard
- [ ] Simple prediction stub for race goals (transparent heuristic; label as estimate)

### Acceptance criteria

- User can create/edit/complete a goal and see progress update after sync

---

## 1.4 Padel Journal (optional but valuable)

### Implement

- [ ] Post-session prompt: Great / Good / Average / Bad / Very bad
- [ ] Optional free-text note
- [ ] Store as subjective feedback linked to activity
- [ ] Basic correlation view later (can start in Phase 2 if thin)

### Acceptance criteria

- Journal entry saves and appears on activity detail
- UI never implies causality from a single entry

---

## 1.5 Reliability, observability, ops

- [ ] Job retry/dead-letter handling for failed Strava fetches
- [ ] Admin or founder tooling: user list, sync status, requeue import
- [ ] Error monitoring (e.g. Sentry)
- [ ] Audit log for connect/disconnect/delete

### Acceptance criteria

- You can diagnose a stuck sync without SSHing into the DB blindly

---

## 1.6 Closed beta launch & learning loop

### Implement / operate

- [ ] Recruit 10–50 participants from local communities
- [ ] Free closed beta positioning: *Technology for smarter training in the Dominican Republic*
- [ ] Weekly founder review of feedback + most-used features
- [ ] Insight quality review sessions (useful vs misleading)

### Exit metrics (targets from PRD)

| Metric | Target |
| --- | --- |
| Participants | 10–50 |
| Strava connection rate | ≥ 70% |
| Onboarding completion | ≥ 70% |
| Weekly active users | ≥ 50% |
| Weekly AI engagement | N/A until Phase 2 (track rule-based insight views instead) |

**More important than numbers:** users voluntarily return to understand training.

### Explicitly deferred

- Payments, open registration, coach platform, wearables, training plans, social/messaging, mobile apps

---

# Phase 2 — AI Analyst

**Goal:** Add grounded AI that explains calculated athlete state — never invents metrics.

**Principle:** Algorithms calculate. AI explains.

---

## 2.1 AI context pipeline

### Implement

```text
Raw activities
  → Metrics engine
  → Aggregated athlete state
  → Relevant historical retrieval
  → Question-specific context
  → LLM (OpenAI)
```

- [ ] Athlete state snapshot builder (profile + recent summaries + PRs + goals)
- [ ] Retrieval modules by question type:
  - today’s activity + similar historical runs
  - last 14 days load/intensity
  - sport-specific trends
  - cross-sport context
  - goals progress
- [ ] Prompt templates with hard rules:
  - only use provided numbers
  - cite time ranges
  - say when data is insufficient
  - no medical diagnosis
- [ ] Response schema: answer + supporting metrics + caveats
- [ ] Logging of prompts/context for quality review (PII-safe retention policy)

### Acceptance criteria

- AI cannot answer without retrieved context
- Hallucinated numbers are caught in evaluation set of known questions

---

## 2.2 Ask My Data

### Implement

- [ ] Chat / question UI
- [ ] Suggested starter questions from PRD:
  - Why am I getting slower?
  - Am I training too much?
  - How has my running improved?
  - Does padel affect my running?
  - Compare this month to last month
  - Am I consistent?
  - What should I focus on?
- [ ] Conversation history per athlete (scoped)
- [ ] Rate limiting / abuse controls
- [ ] “Grounding” UI: show key metrics used in the answer

### Acceptance criteria

- Answers reference the user’s real week/month totals
- Empty/insufficient data produces a clear fallback, not speculation

---

## 2.3 Weekly AI intelligence report

### Implement

- [ ] Scheduled job: generate weekly report per active athlete
- [ ] Sections:
  - Overall assessment
  - What improved?
  - What changed?
  - What should you watch?
  - Biggest opportunity
- [ ] Deterministic stats block + AI narrative
- [ ] Email or in-app notification (pick one for V1 of reports)
- [ ] `WeeklyReport` entity stored for history

### Acceptance criteria

- Report generates every week for athletes with activity
- Stats block matches dashboard numbers exactly

---

## 2.4 Personal patterns

### Implement

- [ ] Pattern detection jobs (deterministic first):
  - pace after high-intensity padel
  - performance after rest days
  - volume spikes preceding slower weeks
- [ ] `AthletePattern` entity: description, sample size, confidence, time period
- [ ] UI with correlation vs causation disclaimer
- [ ] AI explanation layer on top of detected patterns

### Acceptance criteria

- Patterns only surface with minimum sample size
- Confidence + observations are visible

---

## 2.5 Deeper sport-specific intelligence

- [ ] Running: interval/race-effort heuristics refinement
- [ ] Cross-sport Q&A reliability improvements
- [ ] Goal analysis via AI using goal + training context

### Exit metrics

| Metric | Target |
| --- | --- |
| Weekly AI engagement | ≥ 30% of WAU |
| Useful insight feedback (thumbs / survey) | Track baseline; improve week over week |
| Support tickets about wrong numbers | Trend down |

### Explicitly deferred

- Autonomous training plan generation, adaptive scheduling, coach AI summaries (Phase 4+)

---

# Phase 3 — Open Beta & Monetization Experiments

**Goal:** Open registration, keep a useful free tier, and test pricing without locking the model too early.

---

## 3.1 Open access

- [ ] Remove invite-only (or keep soft waitlist if capacity constrained)
- [ ] Public marketing/landing page
- [ ] Early beta user benefits / badges / grandfathering flags
- [ ] Terms of service + privacy policy published
- [ ] Usage & cost dashboards (especially AI spend)

---

## 3.2 Packaging experiments

Decide with closed-beta usage data which model to test first:

**Option A — Subscription**

- Free: Strava connect, history, basic metrics, basic weekly summary  
- Pro: advanced intelligence, historical analysis, patterns, AI questions, advanced reports, goals analysis

**Option B — Insight credits**

- Free: 5 Insights/month  
- Plus: 30 / Power: 100  
- Consumption examples: simple Q=1, comparison=2, deep analysis=3, full assessment=5  
- Dashboards ideally do **not** consume credits

**Option C — Hybrid**

- Free analytics + small Insight allotment  
- Pro subscription includes monthly Insights + credit packs

### Implement (whichever experiment runs)

- [ ] Entitlements service (plan, credits balance, feature flags)
- [ ] Paywall UI that does not block core “what did I do?” value
- [ ] Stripe (or equivalent) checkout + webhooks
- [ ] DR-aware pricing (affordable local pricing; don’t assume US SaaS defaults)
- [ ] Analytics: conversion, retention by plan, AI cost per user

### Exit criteria

- Chosen monetization direction backed by usage, not guesswork
- Free tier still delivers the Strava “aha” insight regularly
- Unit economics of AI features understood

### Explicitly deferred

- Coach billing, white-label, marketplace payments

---

# Phase 4 — Coach Platform

**Goal:** Coaches sit on top of athlete intelligence without manually processing raw activities.

**Out of MVP historically — only start when athlete product retention is proven.**

---

## 4.1 Relationships & permissions

```text
Coach → invites athlete → athlete accepts → coach sees intelligence (revocable)
```

- [ ] Coach account type / role
- [ ] `AthleteRelationship` entity (status, permissions, invitedAt, acceptedAt, revokedAt)
- [ ] Invite by email/link
- [ ] Athlete consent + revoke access anytime
- [ ] Data minimization for coach views

---

## 4.2 Coach dashboard

- [ ] Roster of athletes
- [ ] Per-athlete snapshot: load, consistency, trends, recent activities, goals
- [ ] Athlete detail intelligence view (read-only unless notes)
- [ ] Filters: needs attention, improving, inactive

---

## 4.3 Coach alerts

Examples:

- Volume up significantly (e.g. +24%)
- No training for 7 days
- High-intensity cluster (e.g. 4 hard sessions)
- Pace improving
- New PR

Implement:

- [ ] Alert rules engine
- [ ] In-app alert feed (+ optional email/WhatsApp later)
- [ ] Alert acknowledge / dismiss
- [ ] Copy makes clear: coach decides; PacePilot informs

---

## 4.4 Coach notes & AI summaries

- [ ] `CoachNote` on athlete timeline
- [ ] AI-generated coaching summary from athlete state (grounded)
- [ ] Export/share summary to athlete (optional)

### Exit criteria

- Coaches weekly-active on roster views
- Athletes comfortable with consent model
- Alerts reduce manual Strava stalking (qualitative interviews)

---

# Phase 5 — Additional Data Sources

**Goal:** Expand beyond Strava only when demand is validated.

Potential sources (priority by demand, not vanity):

1. Apple Health  
2. Garmin  
3. COROS  
4. Fitbit  

### Per-source checklist

- [ ] OAuth / HealthKit strategy
- [ ] Source-specific sync jobs
- [ ] Map into unified `Activity` model (`source` field)
- [ ] Deduplicate cross-source activities (same workout appearing twice)
- [ ] Recompute metrics with multi-source awareness
- [ ] Connect/disconnect + deletion flows
- [ ] UX for partial permissions / missing metrics

### Exit criteria

- At least one non-Strava source used weekly by a meaningful share of Pro users
- Dedup accuracy validated on real multi-device athletes

---

# Phase 6 — Adaptive Coaching

**Goal:** Move from “what does it mean?” to “what should I do next?”

Potential capabilities:

- [ ] Training plan templates
- [ ] Workout recommendations
- [ ] Adaptive scheduling
- [ ] Recovery-aware recommendations
- [ ] Race preparation plans
- [ ] Multi-sport periodization

### Guardrails

- Recommendations grounded in athlete history + load
- Clear separation from medical advice
- Prefer assistive recommendations over autonomous plan mutation until trust is high
- Coach override if athlete is coached

### Exit criteria

- Athletes follow recommendations often enough to measure outcome deltas
- No increase in injury-related complaints attributable to aggressive prescriptions

---

# Cross-cutting engineering standards (all phases)

These apply continuously:

### Architecture

- **Turborepo monorepo** is the only repo layout
- Domain entities/models live in **`packages/core`** (DDD domain layer)
- Persistence in `packages/db`; HTTP/UI adapt at boundaries — do not leak Drizzle/React types into `core`
- New core concepts are added to `core` before wiring UI/API features that depend on them

### Data & correctness

- Deterministic metrics are versioned and recomputable from `rawData` / stored activities
- AI never recalculates canonical metrics
- Every insight should be explainable from stored summaries

### Security & privacy

- Encrypt OAuth secrets
- Athlete-owned data: disconnect, delete, revoke coach access
- Never expose private athlete data publicly
- No medical/injury diagnosis claims

### Product quality bar

- Prefer “You tend to…” over “Athletes should…”
- Cross-sport by default
- Empty/insufficient data states over fake confidence

### Observability

- Sync success rate
- Import duration
- Insight engagement
- AI cost per active athlete
- North star: **Useful Insights per Active Athlete**

---

# Suggested build order (first 90 days)

Use this if you want a concrete near-term sequence from zero:

| Week | Focus | Phase |
| --- | --- | --- |
| 1 | Turborepo monorepo, `packages/core`, `apps/web` + `apps/api`, `packages/db`, Better Auth, deploy | 0.1–0.2 |
| 2 | Strava OAuth + encrypted tokens + connection UI | 0.3 |
| 3–4 | Historical import jobs + Activity normalization + timeline | 0.4 |
| 5–6 | Metrics engine v1 (volume, frequency, intensity, load, PRs) | 0.5 |
| 7 | Dashboard + weekly/monthly summaries + running/padel views | 0.6 |
| 8 | Privacy deletes, polish, personal dogfooding | 0.7–0.8 |
| 9–10 | Invite flow, onboarding, goals, reliability | 1.1–1.5 |
| 11–12 | Recruit closed beta; iterate on insight quality | 1.6 |
| 13+ | AI context pipeline + Ask My Data + weekly AI report | 2.x |

---

# Definition of done for “start building”

You are ready to write code when:

1. This roadmap is accepted as the sequencing source of truth  
2. Architecture locked: **Turborepo monorepo** + **`packages/core` domain layer**  
3. Strava API application credentials exist (or are requestable)  
4. Postgres provider chosen (Supabase or Neon)  
5. Background jobs provider chosen (Inngest or Trigger.dev)  
6. Phase 0.1 checklist is the first implementation task list  

**Next concrete step:** implement Phase 0.1 (Turborepo + `packages/core` + apps), then 0.2 (auth), then 0.3 (Strava).
