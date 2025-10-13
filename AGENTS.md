# Repository Guidelines

## Project Structure & Module Organization
- Source: `app/` (Next.js App Router), UI in `components/`, utilities in `lib/`, types in `types/`.
- Data/scripts: `scripts/` (scrapers, seeders), config in `supabase/` and root `*.config.mjs` files.
- Assets: `public/` static files.
- Tests: `__tests__/` mirrors `app/` and `lib/` paths.

## Build, Test & Development Commands
- `npm run dev`: Start local dev server with Turbopack.
- `npm run build`: Production build (Next.js 15).
- `npm start`: Run built app.
- `npm run lint`: Lint using `next/core-web-vitals` rules.
- `npm test` | `npm run test:watch` | `npm run test:coverage`: Run Jest + RTL; coverage via V8.
- Example data tasks (require `.env.local`):
  - `npm run seed`
  - `npm run scrape:all` (prefer `:dry` variants during development)

## Coding Style & Naming Conventions
- Language: TypeScript/ESM; React 19 + Next.js App Router.
- Components: PascalCase in `components/` (e.g., `GpuTable.tsx`).
- Hooks/utilities: camelCase files (e.g., `useGpuModels.ts`, `formatPrice.ts`).
- Routes: follow `app/segment/page.tsx` and API in `app/api/.../route.ts`.
- Client components must declare `"use client"`.
- Run `npm run lint` before pushing; fix warnings when feasible.

## Testing Guidelines
- Frameworks: Jest, `@testing-library/react`, `@testing-library/jest-dom`.
- Location: `__tests__/.../*.test.{js,ts,tsx}` mirroring source paths.
- Write tests in RTL style (user-centered) and mock Next.js/router and network calls.
- Run `npm run test:coverage`; keep or raise coverage for changed areas.

## Commit & Pull Request Guidelines
- Commits: Imperative mood; reference issues when applicable (e.g., `Issue #45: Implement SEO structured data`).
- Group related changes; keep commits focused and descriptive.
- PRs must include:
  - Clear summary, linked issues (`Fixes #123`).
  - Test coverage notes and relevant screenshots for UI.
  - Checklist: `lint`/`test` pass, docs updated.

## Security & Configuration Tips
- Secrets live in `.env.local` (not committed). Common vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- For scraping scripts, prefer `:dry` variants first (e.g., `npm run scrape:aws:dry`).
- Avoid storing scraped raw data in repo; use Supabase and provided upsert scripts (`npm run upsert:gpu-models`).

## Additional Agent Notes
- Keep the `Learn` link in the global navigation unless the user explicitly asks for its removal.
- Avoid destructive changes when handling tasks that are unrelated to the user's current request; check with the user before modifying or deleting existing content beyond the asked scope.

## Agent Workflow Expectations
- After making code changes always run the linter (`pnpm run lint` or `npm run lint`) and resolve any reported issues before handing work back.
- Run a production build locally (`pnpm run build` or `npm run build`) whenever Server Components, configuration, or dependency changes are involved; surface and fix build-time errors instead of relying on the user to find them.
- If a command fails in the sandbox (e.g., missing dependencies), call it with escalation rather than skipping the check.
- Mention the commands you ran (and their success/failure) in your final summary so reviewers know validation happened.
