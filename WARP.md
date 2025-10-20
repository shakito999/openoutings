# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Data/auth/storage: Supabase (see supabase/schema.sql)
- Testing: Vitest (+ RTL, jsdom) and Playwright

Setup and environment
- Create .env.local from .env.example with:
  - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (required)
  - SUPABASE_SERVICE_ROLE_KEY (server-only; used in API routes)
  - Optional: NEXT_PUBLIC_MAP_TILES_URL, NEXT_PUBLIC_MAP_ATTRIBUTION, IMAGE_* knobs
- In Supabase, run supabase/schema.sql and create storage bucket images

Commands
- Install deps: npm ci (or npm install)
- Dev server: npm run dev (http://localhost:3000)
- Build: npm run build
- Start (prod): npm start
- Lint: npm run lint -- .
- Typecheck: npm run typecheck
- Unit tests (Vitest):
  - All: npm test
  - Watch/UI: npm run test:ui
  - Coverage: npm run test:coverage
  - Single file: npx vitest run src/path/to/file.test.tsx
  - Single test by name: npx vitest run -t "test name substring"
- E2E (Playwright):
  - All: npm run e2e
  - Single spec: npx playwright test e2e/smoke.spec.ts
  - Grep by title: npx playwright test -g "login"

Architecture and key modules
- App Router (src/app)
  - Root layout and styles: src/app/layout.tsx, src/app/globals.css (Tailwind v4 via @import and @theme). Fonts via next/font.
  - Auth: src/app/(auth)/login/page.tsx is a client component rendering Supabase Auth UI (Google/GitHub providers) using the browser client.
  - Events
    - List/search (server component): src/app/events/page.tsx uses createServerSupabase() to query public.events. Supports filters via query params (?q, from, to). The client-side Filters component updates the URL.
    - Create (client): src/app/events/new/page.tsx inserts into public.events using the browser client; collects location via Map and tags via InterestsPicker. Middleware targets this route for protection.
  - Polls
    - Create (client): src/app/polls/new/page.tsx inserts into public.availability_polls and derives a short slug.
    - View (server): src/app/polls/[id]/page.tsx resolves poll by slug and lists slots; aggregation kept minimal for MVP.
  - API routes
    - Image upload/downscale: src/app/api/images/upload/route.ts (runtime: nodejs) accepts multipart file, resizes via sharp, uploads to Supabase Storage (bucket images) using a service-role client, returns public URL.
- Supabase integration (src/lib)
  - supabaseClient.ts: Browser client created from NEXT_PUBLIC_* values; used in client components.
  - supabaseServer.ts: createServerSupabase() wraps @supabase/ssr with Next cookies for RSC/route handlers; createServiceClient() builds a server-only client using SUPABASE_SERVICE_ROLE_KEY for privileged tasks (e.g., storage uploads).
- Components (src/components)
  - Map: React Leaflet loaded via next/dynamic with SSR disabled; tile URL/attribution read from NEXT_PUBLIC_* envs; emits coordinates on click.
  - InterestsPicker: simple tag toggle control emitting a string[] selection.
  - Filters: client-side URL query editor used by the events list.
- Middleware
  - middleware.ts matches /events/new; currently pass-through. Extend to enforce auth/role checks as needed.
- Data model
  - See supabase/schema.sql for tables (profiles, interests, events, photos, attendees, reviews, availability_polls, poll_slots, poll_votes) and enums (gender_restriction, day_slot). Enable and refine RLS in Supabase per comments in the file.

Testing stack details
- Vitest: jsdom environment, setup via vitest.setup.ts to include @testing-library/jest-dom. Configure coverage reporters (text, html) in vitest.config.ts.
- Playwright: playwright.config.ts boots the dev server (npm run dev), reuses if not in CI, headless by default.

Path aliases and tooling
- TS path alias: @/* -> ./src/* (see tsconfig.json)
- ESLint flat config extends next/core-web-vitals and next/typescript and ignores build artifacts.
