---
name: verify
description: How to launch and drive vidya-ai for runtime verification
---

# Verifying vidya-ai

Not a git repo (`git status` fails — "not a git repository"). Scope
for `/verify` here means whatever the user names (e.g. "all 13
features") — there's no diff to establish range from.

## Launch

`mcp__Claude_Browser__preview_start` with `name: "vidya-ai-dev"`
(reads `.claude/launch.json`, runs `npm run dev`, port 3000). Wait
~3s after start before navigating — first compile is slow.

## Auth

No seeded login on a fresh server — go to `/login` and sign in:
- email: `rahul.verma@gmail.com`
- password: `TestPass789!`

This is a real Supabase-backed account (project `jvdjrgzbtebzgppegjze`)
with a completed profile, ~180 XP, and history from prior sessions.
Session is a browser cookie — persists across navigations in the same
tab, and is shared across tabs opened in the same session (a second
`tabs_create` tab is already authenticated).

## Driving it — form_input, not `type`

Real keyboard (`computer` action `type`) is unreliable in this
environment — sometimes silently no-ops (input stays empty) even
after a successful click-to-focus. **Use `form_input` to set values,
then `javascript_tool` to `.click()` the submit button** (reading
button `.disabled` first to confirm the value actually landed in
React state before clicking):

```js
// after form_input on the ref:
(function(){
  const btn = Array.from(document.querySelectorAll('button'))
    .find(b => b.textContent.includes('Generate Quiz'));
  return JSON.stringify({disabled: btn.disabled}); // confirm false before clicking
})();
```

This combo (form_input + JS `.click()`) has been reliable across every
feature. Plain `computer` click on buttons (not inputs) works fine.

## Known environment quirks (not app bugs)

- `screenshot` always fails: "Browser pane is not displayed, so the
  page is not compositing frames." Use `get_page_text` /
  `read_page` for evidence instead — no visual capture available here.
  Root cause confirmed: the tab reports `document.hidden: true`,
  `visibilityState: "hidden"`, `hasFocus(): false`, and
  `requestAnimationFrame` never ticks (tested: 0 ticks over 2.7s).
  Browsers suspend rAF for non-composited/backgrounded pages, which is
  also why screenshots fail. Practical effect: any rAF-driven animation
  (framer-motion `animate()`, CSS-in-JS spring/tween libraries, count-up
  effects, etc.) will visibly get "stuck" at its initial value in this
  tool even when the code is correct — `onUpdate` callbacks simply never
  fire. Don't diagnose this as an app bug; verify the effect fires and
  the animation controls are created (temporary `console.log` in the
  effect is the fastest check), then trust the code if that looks right.
  CSS-only animations/transitions (not JS-driven) are unaffected.
- `read_console_messages` sometimes returns **stale buffered
  entries** from before your last edit/navigation (observed: a
  console error referencing a component that couldn't possibly be on
  the current page). If a console error looks impossible given what
  you just did, open a fresh tab (`tabs_create`) and re-check there
  before trusting it.
- Dev server restarts periodically (new `serverId` each `preview_list`
  call sometimes) — first request after a restart can 404 transiently.

## The 14 dashboard features (sidebar order)

Home, Doubt Solver (`/doubt`), Quiz (`/quiz`), Flashcards
(`/flashcards`), Planner (`/planner`), Career GPS (`/career`),
Certifications (`/certifications`), Interview (`/interview`), PYQ Mode
(`/pyq`), Leaderboard (`/leaderboard`), Resources (`/resources`),
Originality/Plagiarism (`/plagiarism`), Analytics (`/analytics`),
Profile (`/profile`).

Each AI-backed feature (Doubt, Quiz, Flashcards, Planner, Career,
Interview, PYQ, Resources, Plagiarism) awards XP on success — reading
the sidebar XP counter before/after an action is a fast, reliable
correctness signal (no XP change after a submit = something silently
failed).

## Known, currently-accepted gaps (not bugs to re-report each run)

- `user_achievements` is never written anywhere in the app. Profile's
  Achievements panel (`src/app/(dashboard)/profile/page.tsx:43-51`) is
  a client-side simulation computed live from `user_progress` stats
  (`total_doubts`, `total_quizzes`, `streak`, `xp`,
  `total_flashcards_reviewed`) — it DOES move as you use the app, but
  nothing is awarded, no achievement-XP bonus is given, and there's no
  permanent record. Two of the ten (Career Mapped, Interview Ready)
  are structurally unreachable — no progress counter tracks them at
  all. `user_progress.total_quizzes`/`total_doubts` ARE now
  incremented correctly (fixed via `COUNTER_EVENTS` in
  `src/lib/stores.ts`) — Profile's stat tiles reflect real activity.
- Analytics page (`src/app/(dashboard)/analytics/page.tsx`) is 100%
  hardcoded mock data — not reading Supabase at all, by the file's
  own comment.

These are flagged findings the user has been told about, not
regressions to fix reflexively — confirm they're still present, don't
re-diagnose from scratch.
