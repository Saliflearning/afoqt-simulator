# AFOQTPro

Unofficial AFOQT-style practice application built with Next.js, TypeScript, and local-first progress tracking.

Live app: [afoqt-simulator.vercel.app](https://afoqt-simulator.vercel.app)

## What this repo demonstrates

- multi-mode exam prep experience with section drill, adaptive review, full-exam simulation, and analytics
- client-side spaced repetition using an SM-2 review model
- timed practice flows and local persistence for repeat study sessions
- polished mobile-friendly Next.js UI with PWA support
- recruiter-friendly product thinking around pacing, feedback loops, and learning analytics

## Important scope note

This is an unofficial practice tool.

- It is not affiliated with the U.S. Air Force.
- It does not contain official or licensed AFOQT exam content.
- It should be treated as a supplemental study simulator, not an authoritative source of exam truth.

Because educational accuracy matters, this repo now includes validation checks for question-bank integrity and known corrected answer keys.

## Current product shape

The app includes:

- section-based drill mode
- adaptive review mode using SM-2-style scheduling
- full exam simulation
- analytics views for performance trends
- local-first storage for sessions, streaks, and review state

## Tech stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Radix UI primitives
- Framer Motion
- Recharts

## Local development

```bash
npm install
npm run test
npm run lint
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation and quality gates

This repo now ships with automated checks for:

- known corrected arithmetic answer keys
- duplicate question IDs
- out-of-range answer indices
- low-confidence explanation markers such as unresolved "wait" / "recalculate" language
- SM-2 scheduling behavior and timing-to-quality mapping

CI runs on every push and pull request to `master`.

## Architecture at a glance

```text
Next.js App Router UI
  -> local question bank (lib/questions.ts)
  -> practice/session logic
  -> SM-2 review scheduling (lib/sm2.ts)
  -> localStorage persistence (lib/storage.ts)
  -> analytics + weak-topic views
```

## Known limitations

- question content is still independently authored and needs continued review
- persistence is local-first only; there is no account sync or cloud backup
- no official scoring equivalence is claimed
- this repo is strong as a learning-product prototype, not as an official test-prep authority

## Best portfolio framing

This project is strongest when presented as:

"A learning-product simulator that combines adaptive practice, spaced repetition, analytics, and timed exam UX in a polished client application."

That framing is stronger and more trustworthy than positioning it as official exam prep.
