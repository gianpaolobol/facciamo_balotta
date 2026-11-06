# Facciamo Balotta — First Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver a private, demonstrable Expo app for web, iOS and Android, with provider access prepared fail-closed and a practical physical marketing plan.

**Architecture:** One Expo/React Native client, following the verified Fungo Italia stack and EAS distribution method. A separate Node 24/SQLite API owns OAuth, private profiles, beta admission and sessions. The private hosted web preview uses only clearly labelled fictional fixtures until the API and provider credentials are connected.

**Tech Stack:** Expo 58.0.2, React 19.3, React Native 0.88.0-rc.3, TypeScript, EAS, Node 24 built-ins, SQLite.

**Spec:** `docs/superpowers/specs/2026-11-06-facciamo-balotta-design.txt`, plus the user's approval and native-platform extension in this conversation.

## Global Constraints

- Territory: Emilia-Romagna; per-person location and travel constraints.
- Login: Google and Facebook; Apple prepared for iOS; no Instagram login, email/password, phone login or additional providers in this increment.
- Real user writes require provider identity, beta admission and server authorization. Never imply fictional fixtures are real people or active AI results.
- New app identifiers and EAS project; never reuse Fungo Italia's bundle identifier, project ID, App Store app ID or signing configuration.
- Implement the authorized scope autonomously. Credentials and actual tester identities are external prerequisites; do not invent them.

## Review Focus

1. OAuth callbacks must be state-bound, one-time and fail closed when credentials are missing.
2. Native handoff must require the same client's PKCE verifier and never put a session bearer token into a deep link.
3. Session cookies cannot authorize cross-origin writes; one user cannot access another's private profile.
4. Date confirmations belong to a proposal version; organizer-only approvals cannot overfill a group.
5. Demonstration mode must never collect, transmit or persist a real personal profile and must not masquerade as a live beta.

### Task 1: Domain and native/web foundations
Files: `src/domain.mjs`, `tests/domain.test.mjs`, `app.config.ts`, `eas.json`, `.github/workflows/ci.yml`.
Interfaces: `confirmDate(proposal, userId, version)`, `reviseDate(proposal, changes)`, `approveRequest(activity, actorId, applicantId)`, `matchReasons(a,b)`.
- [x] Write tests: stale confirmations rejected; both confirmations needed; revisions clear prior confirmations; unauthorized/full/duplicate group approvals rejected; common interests explained without a compatibility percentage.
- [x] Run `npm test` and observe the missing domain module failure.
- [x] Implement immutable domain operations and Expo/EAS configuration with separate identifiers.
- [x] Run domain tests, then commit.

### Task 2: Real authentication and beta access API
Files: `server/auth.mjs`, `server/store.mjs`, `server/index.mjs`, `tests/auth.test.mjs`.
Interfaces: `createApp({config, store, providerFetch}) => async (Request) => Response`; `createStore(path)`; Google/Facebook OAuth begin/callback, native exchange, `/api/session`, `/api/profile`, `/api/logout`, `/api/account`.
- [x] Write failing tests for disabled providers, state mismatch/replay, uninvited users, distinct provider subjects, native PKCE misuse, unauthorized profiles, CSRF, logout and deletion.
- [x] Implement opaque sessions, temporary OAuth attempts, provider identity mapping and exact beta allowlist. Email verification/admission is provider-dependent and fails closed when unavailable.
- [x] Run full suite and commit. No live OAuth claim without real provider round-trip.

### Task 3: Mobile-first client and private preview
Files: `App.tsx`, `src/auth.ts`, `src/ui.tsx`, `src/fixtures.ts`, `src/screens/*.tsx`, `index.ts`.
Interfaces: auth client exposes configured-provider login, secure native session storage and session/profile access; demo uses separate in-memory fixtures and no backend writes.
- [x] Build welcome/login, fictional guided demo, activities and filters, organizer approval, person proposal/date confirmation, and a non-persisted demonstration profile.
- [x] Connect real API configuration without inventing credentials. Explain non-active providers clearly in the interface.
- [x] Run `npm test`, `npm run typecheck`, `npm run export:all`; inspect responsive web flows through the permitted preview browser.
- [x] Save source, deploy private preview, retain literal returned URL, and commit verified changes.

### Task 4: Distribution handoff and physical marketing
Files: `README.md`, `docs/BETA_SETUP.md`, `docs/PIANO_MARKETING_FISICO.md`, `scripts/release-check.mjs`.
- [x] Document new Expo project, developer console configurations, TestFlight, Play internal track, backend HTTPS and actual tester allowlist.
- [x] Prepare a staged regional physical campaign: partner displays, stickers on consented surfaces, cards and removable 3D counter tokens; source-specific QR codes only after a stable public URL exists.
- [x] Clearly distinguish web/native bundle exports from signed binaries and deployed auth from prepared source.
- [x] Run full checks, request fresh code review, fix important findings, and record final evidence and remaining account prerequisites.
