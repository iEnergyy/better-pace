# PacePilot — Product Requirements Document

**Status:** MVP / Closed Beta  
**Version:** 0.2  
**Primary data source:** Strava  
**Initial market:** Dominican Republic  
**Long-term vision:** Personal Athlete Intelligence Platform

---

# 1. Product Vision

PacePilot is a personal athlete intelligence platform that turns activity data into useful, personalized insights.

The product initially connects to Strava, analyzes an athlete's activities across sports, identifies trends and relationships, and provides an AI interface for understanding their training and performance.

> **Strava tells you what you did. PacePilot tells you what it means.**

The long-term goal is to create a digital intelligence layer for an athlete's entire training life.

---

# 2. Problem

Modern athletes generate enormous amounts of fitness data.

Strava provides activities, distance, pace, heart rate, elevation, calories, GPS, sport type, and training history.

But raw activity data doesn't answer the questions athletes actually care about:

- Am I getting fitter?
- Am I training too much?
- Why am I getting slower?
- Am I recovering?
- How does padel affect my running?
- Should I train today?
- Am I ready for my race?
- What should I improve?
- Is my training balanced?
- What has changed over the last three months?

PacePilot converts raw activity data into answers.

---

# 3. Product Principles

## 3.1 Data First

The platform should build a structured model of the athlete before relying on AI.

AI should not be responsible for calculating fundamental metrics.

## 3.2 AI Explains; Algorithms Calculate

Deterministic systems calculate volume, pace, trends, training frequency, training load, changes, personal records, and sport-specific metrics.

AI converts those insights into natural-language explanations and recommendations.

## 3.3 Cross-Sport Intelligence

An athlete is not simply a runner, cyclist, swimmer, or padel player.

They are an athlete who participates in multiple activities.

## 3.4 Personalization Over Generic Advice

The system should prioritize:

> "You tend to..."

over:

> "Athletes should..."

Historical behavior should influence recommendations.

## 3.5 Athlete-Owned Data

Athletes should be able to disconnect Strava, delete their data, leave a coaching program, and control who can see their data.

---

# 4. Target Users

## Primary MVP User

Active recreational athletes:

- Runners who also play padel
- HYROX athletes
- Runners who swim
- Cyclists who run
- Multi-sport athletes
- Fitness enthusiasts

The product should not require a coach.

## Secondary User

Coaches:

- Running coaches
- HYROX coaches
- Padel coaches
- Triathlon coaches
- Personal trainers

Coaches will eventually be able to connect to athletes and use PacePilot as an intelligence layer.

---

# 5. Core Product Model

```text
                STRAVA
                   │
                   ▼
          ┌─────────────────┐
          │   DATA LAYER    │
          │ Activities      │
          │ Metrics         │
          │ History         │
          │ Athlete Profile │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ INTELLIGENCE    │
          │     ENGINE      │
          │ Trends          │
          │ Load            │
          │ Patterns        │
          │ Predictions     │
          │ Recommendations │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │    AI COACH     │
          │ Explain         │
          │ Answer          │
          │ Recommend       │
          │ Compare         │
          └─────────────────┘
```

---

# 6. MVP Scope

## Included

### Account

- User registration
- Authentication
- Athlete profile

### Strava

- OAuth connection
- Historical activity import
- Activity synchronization
- Disconnect integration

### Athlete Intelligence

- Unified activity timeline
- Sport classification
- Weekly summaries
- Monthly summaries
- Training volume
- Training frequency
- Intensity analysis
- Trend analysis
- Personal records
- Training load
- Cross-sport analysis

### Sports

Initial support:

- Running
- Padel
- Cycling
- Swimming
- Walking
- Hiking
- Strength training where Strava activity data supports it

Running receives the deepest analysis initially.

### AI

- Ask My Data
- Weekly AI summary
- Training insights
- Trend explanations
- Cross-sport questions

### Goals

- Create a goal
- Goal date
- Goal type
- Progress tracking

---

# 7. Explicitly Out of Scope for MVP

Do not build:

- Apple Health
- Garmin Connect
- COROS
- Fitbit
- Training plan generation
- Nutrition tracking
- Workout scheduling
- Social network
- Messaging
- Payments between athletes and coaches
- Mobile application
- Full coach management platform
- Medical/injury diagnosis
- Automatic workout modification

These become potential future features.

---

# 8. Strava Integration

## Authentication

Use Strava OAuth.

Flow:

```text
User
  ↓
Connect Strava
  ↓
Strava authorization
  ↓
Callback
  ↓
Store authorization securely
  ↓
Import activities
```

## Historical Import

After connection:

```text
Import historical activities
        ↓
Normalize activities
        ↓
Calculate metrics
        ↓
Build athlete profile
        ↓
Generate initial analysis
```

The user should see progress while importing.

---

# 9. Unified Activity Model

Every activity should be normalized into a common internal representation.

```typescript
Activity {
  id
  athleteId
  source
  sourceActivityId

  sport
  startedAt
  duration

  distance
  elevationGain

  averageHeartRate
  maxHeartRate

  calories

  averageSpeed
  maxSpeed

  rawData

  createdAt
  updatedAt
}
```

Sport-specific data should be extensible.

```typescript
RunningMetrics {
  averagePace
  fastestPace
  cadence
  gradeAdjustedPace
}

PadelMetrics {
  duration
  averageHeartRate
  maxHeartRate
  calories
}

SwimmingMetrics {
  distance
  duration
  pace
}
```

---

# 10. Athlete Model

PacePilot should maintain an evolving athlete profile.

```typescript
AthleteProfile {
  athleteId
  sports
  trainingFrequency
  weeklyVolume
  trainingLoad
  consistencyScore
  fitnessTrend
  recoveryTrend
  performanceTrend
  goals
  personalRecords
  preferences
  historicalPatterns
}
```

This profile becomes context available to the AI.

---

# 11. Athlete Dashboard

The home screen should answer:

> "How am I doing?"

Example:

```text
GOOD MORNING

Your week

Training load       Moderate
Consistency         91%
Fitness trend       Improving
Recovery trend      Stable

6 activities
5h 42m training
3 sports

──────────────────

INSIGHT

Your training volume is up 12%
from last week.

Your running pace is improving,
but your high-intensity sessions
have also increased.

Consider keeping your next session easy.
```

---

# 12. Activity Timeline

Show all activities chronologically.

Users can filter by:

- Sport
- Date
- Intensity
- Duration

---

# 13. Training Volume

Calculate volume by:

- Day
- Week
- Month
- Sport
- Total training

Example:

```text
THIS WEEK

Running       24 km
Padel          3h 12m
Swimming       1h 05m
Gym            1h 30m

Total training:
7h 47m
```

The platform should distinguish between sport-specific volume and total training exposure.

---

# 14. Training Load

PacePilot should calculate an internal training-load metric using available activity data.

The implementation should initially use a transparent, deterministic methodology.

The exact methodology should be versioned.

The product should avoid presenting this as a medical measurement.

---

# 15. Intensity Analysis

Identify:

- Easy sessions
- Moderate sessions
- Hard sessions
- High-intensity clusters
- Consecutive hard days

Example:

```text
LAST 7 DAYS

Easy        █████
Moderate    ███
Hard        ████

Observation:

4 high-intensity sessions
in 6 days.
```

---

# 16. Cross-Sport Intelligence

This is a major product differentiator.

Example:

```text
Running:
22 km

Padel:
3 sessions

Swimming:
1 session

Gym:
2 sessions
```

The system can identify:

- High overall training frequency
- High-intensity clusters
- Changes in total workload
- Recovery patterns
- Potential interference between activities

Example insight:

> You only ran 22 km this week, but your overall training load is significantly higher because you also played three high-intensity padel sessions.

---

# 17. Padel Intelligence

Strava may not contain match results or technical padel statistics.

PacePilot should focus on physiological/session-level analysis:

- Duration
- Heart rate
- Maximum heart rate
- Calories
- Session frequency
- Training load
- Historical trends

The product should avoid pretending to know match performance when it does not have that data.

## Padel Journal

After a session, optionally ask:

> How did the session feel?

Possible responses:

- Great
- Good
- Average
- Bad
- Very bad

Optional free text can capture context such as:

> "Legs felt heavy."

This creates a subjective-performance dataset that can eventually be correlated with objective data.

The system should present this as an observed correlation, not a proven causal relationship.

---

# 18. Running Intelligence

Running receives the deepest sport-specific analysis in V1.

Analyze:

- Distance
- Pace
- Heart rate
- Cadence
- Elevation
- Long runs
- Easy runs
- Hard runs
- Intervals
- Training frequency
- Pace trends
- Volume trends
- Race efforts
- Personal records

Example:

> Your average easy-run pace has improved from 6:40/km to 6:20/km over the last eight weeks at a similar heart rate.

---

# 19. Goals

Users can define goals.

Examples:

```text
Sub-30 5K
October 10, 2026
Current prediction: 31:05
Target: 29:59
```

```text
Complete HYROX
October 2026
```

```text
Run 500 km this year
```

The intelligence engine evaluates progress toward the goal.

---

# 20. AI "Ask My Data"

Users can ask:

- Why am I getting slower?
- Am I training too much?
- How has my running improved?
- What sport gives me the most cardiovascular load?
- Does playing padel affect my running?
- Compare my training this month to last month.
- What was my best training month?
- Am I consistent?
- What should I focus on?

The AI must ground responses in the athlete's actual data.

---

# 21. AI Context Pipeline

The AI should not receive thousands of raw Strava activities every time.

Instead:

```text
Raw activities
      ↓
Metrics engine
      ↓
Aggregated athlete state
      ↓
Relevant historical context
      ↓
Question-specific retrieval
      ↓
LLM
```

For example, for:

> "Why was my run today bad?"

Retrieve:

- Today's activity
- Similar historical runs
- Previous 14 days
- Previous hard sessions
- Pace trends
- Heart-rate trends
- Subjective feedback

---

# 22. Weekly Intelligence Report

Automatically generate a weekly report.

```text
YOUR WEEK

Overall:
Strong

Training:
5 sessions

Running:
24 km

Padel:
3 sessions

Swimming:
1 session

Training load:
High

Consistency:
92%
```

Sections:

### What improved?

### What changed?

### What should you watch?

### Biggest opportunity

---

# 23. Personal Patterns

Once sufficient data exists, detect recurring patterns.

Example:

```text
Pattern detected:

Your running pace is typically
5–8% slower after high-intensity
padel sessions.

Confidence:
Medium

Observations:
7
```

Show:

- Sample size
- Confidence
- Time period
- Correlation vs. causation disclaimer where appropriate

---

# 24. Personal Records

Track records by sport.

### Running

- Fastest 1K
- Fastest 5K
- Fastest 10K
- Longest run

### Cycling

- Fastest ride
- Longest ride

### Swimming

- Longest swim
- Fastest distance where data permits

### Padel

- Longest session
- Highest recorded HR
- Highest recorded session load

---

# 25. Coach Layer — Future

Once the athlete intelligence platform works, coaches can sit on top of it.

```text
Coach
  ↓
Invites athlete
  ↓
Athlete connects Strava
  ↓
Athlete Intelligence
  ↓
Coach Dashboard
```

The coach sees athlete-level intelligence without needing to manually process raw activity data.

---

# 26. Coach Alerts — Future

Examples:

```text
⚠️ Athlete increased training volume 24%.

⚠️ Athlete has not trained for 7 days.

⚠️ Athlete has accumulated 4 high-intensity sessions.

📈 Athlete's running pace is improving.

🏆 New personal record.
```

The coach makes the actual coaching decision.

---

# 27. Data Privacy

Requirements:

- Secure OAuth token storage
- Encrypt sensitive credentials
- Clear data ownership
- Explicit Strava authorization
- Ability to disconnect Strava
- Ability to delete account/data
- Coach access must be revocable
- Never expose private athlete data publicly

PacePilot should not claim medical diagnoses or injury diagnoses.

---

# 28. Technical Architecture

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
                │ Raw Activities│
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
         Web App                AI Layer
             │                     │
             └──────────┬──────────┘
                        ▼
                  Athlete / Coach
```

---

# 29. Proposed Technology Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Hono
- TypeScript
- PostgreSQL
- Drizzle ORM

## Authentication

- Better Auth

## Background Processing

- Inngest or Trigger.dev

## AI

- OpenAI

## Infrastructure

- Vercel
- Neon (PostgreSQL)

## External Integration

- Strava API

---

# 30. Data Model

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

# 31. Product Roadmap

## Phase 0 — Personal Validation

- Connect personal Strava account
- Import historical activities
- Validate data quality
- Validate metrics
- Identify useful insights
- Identify misleading insights
- Establish baseline experience

## Phase 1 — Closed Beta

Target: **10–50 athletes and coaches**

Initial community:

- Santo Domingo runners
- Padel players
- HYROX athletes
- Swimmers
- Cyclists
- Recreational athletes
- Running coaches
- Personal trainers
- Fitness communities

Primary objective:

> Determine whether users repeatedly find value in their generated insights.

Measure:

- Onboarding completion
- Strava connection rate
- Weekly active users
- AI engagement
- Most-used features
- Common questions
- Retention
- Coach interest
- Willingness to pay

## Phase 2 — AI Analyst

Add:

- Ask My Data
- AI weekly reports
- Historical comparisons
- Goal analysis
- Personal patterns
- More sport-specific intelligence

## Phase 3 — Open Beta

- Open registration
- Introduce optional paid features
- Test pricing
- Continue useful free tier
- Give early beta users special benefits

## Phase 4 — Coach Platform

- Coach accounts
- Athlete invitations
- Coach dashboard
- Athlete monitoring
- Coach alerts
- Coach notes
- AI-generated coaching summaries

## Phase 5 — Additional Data Sources

Potential integrations:

- Apple Health
- Garmin
- COROS
- Fitbit
- Other wearable platforms

Only prioritize based on validated demand.

## Phase 6 — Adaptive Coaching

Potential capabilities:

- Training plans
- Workout recommendations
- Adaptive scheduling
- Recovery-aware recommendations
- Race preparation
- Multi-sport periodization

---

# 32. Monetization Strategy

Monetization should remain intentionally undecided during the closed beta.

The first objective is product validation, not maximizing revenue.

Potential models:

## Subscription

### Free

- Strava connection
- Activity history
- Basic metrics
- Basic weekly summary

### Pro

- Advanced intelligence
- Historical analysis
- Personal patterns
- AI questions
- Advanced reports
- Goal analysis

## Insight Credits

Use terms such as:

- Insights
- Analyses
- Credits

Example:

```text
Free
5 Insights/month

Plus
30 Insights/month

Power
100 Insights/month
```

Potential usage:

```text
Simple question          1 Insight
Historical comparison    2 Insights
Deep training analysis   3 Insights
Full athlete assessment  5 Insights
```

Basic dashboards should not necessarily consume credits.

## Hybrid

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

---

# 33. Pricing Decision Framework

Subscription is preferable if:

- Users interact frequently.
- Weekly reports become habitual.
- Users value continuous monitoring.
- Users want predictable access.

Credits are preferable if:

- Usage is sporadic.
- Users request occasional deep analyses.
- AI computation is a meaningful cost.
- Users dislike recurring subscriptions.
- Coaches have highly variable usage.

The closed beta should provide enough usage data to make this decision.

---

# 34. Dominican Republic Strategy

PacePilot should not assume US SaaS pricing is appropriate for the initial Dominican market.

The initial objective is adoption, learning, and community impact.

Priorities:

- Low friction
- Free closed beta
- Affordable eventual pricing
- Local athlete communities
- Local coaches
- Running groups
- Padel communities
- HYROX communities
- Fitness organizations

The Dominican Republic can function as the initial product laboratory without becoming the permanent geographic limitation.

---

# 35. Community Strategy

Potential positioning:

> **Technology for smarter training in the Dominican Republic.**

Potential communities:

- Running clubs
- Padel communities
- Gyms
- HYROX communities
- Swimming groups
- Fitness creators
- Coaches
- Local races

The goal is not initially to create a social network.

Community members become:

- Early adopters
- Testers
- Ambassadors
- Feedback sources
- Potential coaches
- Potential partners

---

# 36. Competition

PacePilot does not need to replace Strava.

Strava is the initial data source.

The differentiation is the interpretation layer.

```text
Strava
"What did I do?"

PacePilot
"What does it mean?"

Future PacePilot
"What should I do next?"
```

Long-term differentiation:

- Cross-sport analysis
- Personal historical patterns
- Athlete-specific intelligence
- Longitudinal athlete models
- AI interaction with personal training data
- Coach integrations

---

# 37. Long-Term Business Opportunities

Potential revenue streams:

1. Consumer subscriptions
2. Insight credits
3. Coach subscriptions
4. Coach-generated reports
5. White-label platform
6. Community partnerships

These should not be built into the MVP.

---

# 38. Success Metrics

## Phase 0

The founder should be able to:

- Connect Strava
- Import historical activities
- Understand personal training
- Receive useful insights
- Identify insights not obvious from raw Strava data

## Closed Beta

Initial targets:

- 10–50 participants
- 70%+ Strava connection rate
- 70%+ onboarding completion
- 50%+ weekly active users
- 30%+ weekly AI engagement

More important than numeric targets:

> Users voluntarily return because they want to understand their training.

---

# 39. North Star Metric

**Useful Insights per Active Athlete**

The core product validation question:

> **How often does PacePilot provide an athlete with a useful insight that they could not easily derive from Strava themselves?**

---

# 40. MVP Definition

The first version should answer five questions exceptionally well:

1. **What did I actually do?**  
   Unified activity history.

2. **How am I progressing?**  
   Performance and trend analysis.

3. **Am I training too much or too little?**  
   Volume, frequency, and intensity analysis.

4. **What patterns exist in my training?**  
   Historical and cross-sport analysis.

5. **What does all this mean?**  
   AI-powered natural-language analysis.

If PacePilot answers those five questions well, it has the foundation for the larger Athlete Intelligence Platform.

---

# 41. Long-Term Vision

The ultimate product is not a Strava analyzer.

It is a **personal operating system for athletic performance**.

```text
                 ATHLETE
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
    Running       Padel       Swimming
       │            │            │
       └────────────┼────────────┘
                    ▼
              Athlete Data
                    │
                    ▼
            Athlete Intelligence
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    Performance  Recovery    Training
        │           │           │
        └───────────┼───────────┘
                    ▼
                 AI COACH
                    │
              ┌─────┴─────┐
              ▼           ▼
           Athlete      Coach
```

Strategic sequence:

**Strava Integration → Athlete Intelligence → AI Analyst → Coach Platform → Multi-source Athlete OS → AI Coach**
