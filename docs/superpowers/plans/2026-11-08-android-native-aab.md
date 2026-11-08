# Android native AAB Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline.

**Goal:** Compile the current demo into an unsigned Android App Bundle on standard GitHub runners, ready for a separately confirmed upload-signing step.

**Architecture:** The existing Expo package generates native Android files offline. Gradle builds Release; no Expo API, credentials or store upload are involved. Signing remains a separate step so the existing Expo-held APK signer is not silently replaced.

**Tech Stack:** Node24.3, Expo58, ReactNative0.88rc3, JDK17, Android Gradle wrapper, ubuntu-latest.

**Spec:** User-authorized GitHub-native demo distribution; docs/DISTRIBUTION_2026-11-07.md and CONTINUITA.md.

## Global Constraints

- Package it.facciamobalotta.app, version0.1.0; runtime features and service flags unchanged.
- No Expo API, Cloudflare retry, paid runner, new credentials, Google declarations or store submission.
- An unsigned AAB is not installable or published. Retain output and diagnostics7days.

## Review Focus

- Generated Release defaults to debug signing: explicitly clear its signingConfig and reject any JAR signature in output.
- Missing JS bundle, manifest, dex or arm64 libraries: reject incomplete ZIP before artifact upload.
- Versioncode must exceed existing APK2 and stay within Android bounds.
- Gradle failure must fail job, preserving logs without publishing a partial AAB.
- Source revision and SHA256 travel with the unsigned artifact.

### Task1: Manual unsigned native build

**Files:** Create .github/workflows/android-native.yml; update CONTINUITA.md.
**Interfaces:** workflow_dispatch produces artifacts/android/balotta-android-unsigned.aab plus checksum and source record; no secret inputs.

- [ ] Add manual workflow using npmci/test/typecheck, offline prebuild and Gradle bundleRelease; clear release signing, set versioncode from run/attempt.
- [ ] Validate YAML and embedded Python syntax; run existing test suite.
- [ ] Save coherent block with leased GitHub ref update and verify remote contents.
- [ ] Dispatch job, inspect actual native result and artifact. Fix only observed failures.
- [ ] Record actual outcome and remaining signing/legal/physical-test gates.

Configuration-only change; validation uses real native build and output checks, without a mirrored workflow-text test.

## Ledger

- Base c2f215dd9befd7d42d2d8acb1b63f7decd6dd64a; no git checkout locally. GitHub branch/ref leases provide isolation and verified saves.
- Execution already authorized autonomously by user. Prepare unsigned bundle before requesting any new persistent key or Google legal declarations.
