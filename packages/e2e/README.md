# @pacepilot/e2e

Playwright TypeScript end-to-end tests for PacePilot.

## Layout

- `pages/` — Page Object Model classes
- `fixtures/` — shared Playwright fixtures (`testUser`, page objects, `authenticatedPage`)
- `tests/` — specs that consume fixtures only (no raw selectors)

## Commands

```bash
pnpm --filter @pacepilot/e2e exec playwright install chromium
pnpm test:e2e
pnpm --filter @pacepilot/e2e test -- tests/smoke.spec.ts
pnpm --filter @pacepilot/e2e test:ui
```

## Smoke (`tests/smoke.spec.ts`)

Quick path covering:

1. API `GET /health`
2. Unauthenticated dashboard redirect
3. Sign up → dashboard (session survives reload)
4. Sign out → sign in with the same credentials

Requires web on `:3000` (Playwright starts it if needed) and API on `:3001` for the health check.
