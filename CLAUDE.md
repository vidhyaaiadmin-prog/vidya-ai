# Project: Vidya AI — B2B EdTech for Indian students

AI-powered study companion licensed per-institution. Students sign in with an
institution join code, then get Socratic doubt solving, AI quizzes, flashcards,
career/exam planning, mock interviews, PYQ practice, analytics, etc.

Live: https://vidya-ai-lime.vercel.app  ·  Repo: vidhyaaiadmin-prog/vidya-ai

## Stack

- **Next.js 14 App Router**, TypeScript, Tailwind CSS. `src/app/(dashboard)/`
  is the grouped student area; `src/app/admin/` is institution-admin.
- **Supabase** for auth + Postgres. `@supabase/ssr` in middleware, browser
  client in `src/lib/supabase.ts`. Row-level security on every table.
- **AI**: Google **Gemini Flash** for everything (`callGeminiFlash`,
  `callGeminiChat`, `callGeminiVision` in `src/lib/ai.ts`). Anthropic Claude
  is imported but `ANTHROPIC_API_KEY` is NOT set in Vercel — do not route
  features through `callClaude`.
- **State**: zustand with `persist` middleware. `vidya-user` and `vidya-ui`
  localStorage keys.
- **Deploy**: Vercel auto-ships on push to `main`. There is no staging.

## Security guardrails (learned the hard way)

- **All API routes go through `guard()` in `src/lib/security.ts`** which runs
  rate limit → auth → body parse → schema validate → prompt-injection shield.
- **Server-side writes use `createAdminClient()`** (service role, bypasses
  RLS). Client-side writes use the browser client and are subject to RLS.
- **Billing-sensitive tables** (`ai_usage_logs`, `user_progress`, `xp_events`,
  `quizzes`): a pentest on 2026-11-09 found students can self-inflate XP,
  fake quiz scores, and bypass the daily AI cost cap via direct REST writes.
  **Remediation drafts are staged in `drafts/pentest-fix/`** — not yet
  deployed. Phase 1 (cost-cap + admin-view leak) is safe to apply standalone;
  Phase 2 requires coordinated client+server changes. Read
  `drafts/pentest-fix/README.md` before shipping either.
- **Never handle the user's real password.** The user tests with their own
  accounts and types the password themselves. Fine to create synthetic test
  accounts via Supabase admin API with throwaway passwords, cleaned up at
  session end.
- **New tables need their RLS policy in the same migration as the table.**

## Theme

Light "Clean Minimal" since 2026-11-10. White bg, indigo `#635BFF` (brand
primary), sky `#0EA5E9` (secondary), emerald `#10B981` (accent). CSS custom
properties in `src/app/globals.css` and matching Tailwind tokens in
`tailwind.config.js`. **Token names kept from the old dark theme** (so
`bg-navy`, `text-orange`, `bg-gradient-brand` still work) — only values
changed.

## Conventions

- **DRY**: fix a vulnerability or pattern once in `security.ts` or `ai.ts`,
  it propagates to every route.
- **Don't add scope**. Flag adjacent issues in prose, don't silently expand
  the change.
- **Verify in the real browser end-to-end** before declaring a UI change
  done. Type checks ≠ feature works.
- **Service worker is network-first** for static assets (since 2026-10-24).
  Users still need one hard refresh to pick up a new SW version.
- **Preset exam dates go stale** — `planner/page.tsx` has preset exam dates;
  roll them forward annually.

## Pitfalls to know

- **Supabase cookie is chunked + base64-prefixed**: `sb-<ref>-auth-token`
  with value `base64-{...}` or split across `.0`, `.1`, ... chunks.
- **GitHub repo owner is `vidhyaaiadmin-prog`**, not the local git user
  (`Skullblood1`) or the `gh` default. Pushes need `gh auth switch --user
  vidhyaaiadmin-prog` first.
- **Vercel env vars**: Gemini key is set, Anthropic key is NOT.
- **Rate limiter is in-memory per Lambda** — not accurate under load. Fine
  for now, migrate to Upstash Redis before scaling.

## Session etiquette

- Clean up synthetic test accounts before ending a session.
- Don't commit the user's `.env.local` or anything in `drafts/` unless asked.
- Don't push to `main` unless the user asked — Vercel auto-deploys.
- Scratchpad for throwaway files, project tree for things the user keeps.
