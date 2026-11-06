# Balotta lettering and event covers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace generic title fonts with original deployable lettering and apply coherent event artwork to sports and future proposals.
**Architecture:** One custom bundled TTF, a pure taxonomy/selection module and one shared cover component. Image assets are generated once and bundled; event creation never calls an image API.
**Tech Stack:** Existing Expo 58 / React Native / TypeScript, Python fontTools for font authoring, fontkit for artifact tests.
**Spec:** `docs/superpowers/specs/2026-11-06-lettering-and-event-covers.md`.

## Global Constraints

- Preserve the approved illustrated world, account behavior and owner-private audience.
- User-generated titles must work with the same font without generating a new image.
- Every new or unknown initiative gets an existing appropriate category or neutral illustration, never a misleading unrelated sport.
- Keep illustrations original; no reused comic panels or claim of an official font.

## Review Focus

- Italian accents, apostrophes, digits and long event names in the generated font.
- Tennis versus padel and football versus table football.
- Explicit category/type precedence and unfamiliar categories.
- Shared cover selection in lists, details, creation and date cards.
- Mobile heading wrapping and real embedded font loading in native bundles.

### Task 1: Original display font
Files: `scripts/build_display_font.py`, `assets/fonts/BalottaInchiostro.ttf`, `assets/fonts/alphabet-source.png`, `tests/lettering.test.mjs`, `src/ui.tsx`, `App.tsx`, title styles in screens.
Interfaces: bundled font family `BalottaInchiostro`; build script takes source sheet and output path; glyph manifest accompanies font.
- [ ] Add font-artifact tests using fontkit; observe missing-font failure.
- [ ] Generate/inspect the original alphabet; construct and render the font, checking glyph order and contours.
- [ ] Replace all current heading-family uses, including logo and event-generated title preview; preserve body text.
- [ ] Run tests and typecheck, inspect specimen, commit.

### Task 2: Event-cover catalog
Files: `src/art-catalog.mjs`, `src/artwork.ts`, `src/EventCover.tsx`, `tests/art-catalog.test.mjs`, `assets/events/*`, `src/screens/Discover.tsx`, `src/screens/Pair.tsx`, `App.tsx`.
Interfaces: `resolveCover({category,activityType,title,interests}) -> theme key`; `choicesForCategory(category)`; `EventCover({category,activityType,title,interests,height})`.
- [ ] Write tests for explicit climbing, soccer, tennis, padel, unknown sport, table football and new-category fallback; observe missing-resolver failure.
- [ ] Generate/inspect nine images and implement the selector with stable keys and complete asset mapping.
- [ ] Use EventCover in every cover surface; expose subtype choice and live cover preview in the local composer.
- [ ] Run full suite, typecheck, export web/iOS/Android; browser QA; commit and publish the same private Site.
