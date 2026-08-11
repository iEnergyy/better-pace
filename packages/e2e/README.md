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
pnpm --filter @pacepilot/e2e test:ui
```
