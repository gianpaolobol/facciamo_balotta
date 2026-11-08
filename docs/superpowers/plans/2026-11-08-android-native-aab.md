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

- [x] Add manual workflow using npmci/test/typecheck, offline prebuild and Gradle bundleRelease; clear release signing, set versioncode from run/attempt.
- [x] Validate YAML and embedded Python syntax; run existing test suite.
- [x] Save coherent block with leased GitHub ref update and verify remote contents.
- [x] Dispatch job, inspect actual native result and artifact. Fix only observed failures.
- [x] Record actual outcome and remaining signing/legal/physical-test gates.

Configuration-only change; validation uses real native build and output checks, without a mirrored workflow-text test.

## Ledger

- Base c2f215dd9befd7d42d2d8acb1b63f7decd6dd64a; no git checkout locally. GitHub branch/ref leases provide isolation and verified saves.
- Execution already authorized autonomously by user. Prepare unsigned bundle before requesting any new persistent key or Google legal declarations.

- Task1 complete: native run42438885222 SUCCESS, unsigned AAB2101 verified (845entries/4ABI/native+JS), artifact13600868759. No persistent credential used during compilation.
- Authorized follow-up: user explicitly confirmed dedicated Android signing key and encrypted GitHub storage plus Google declarations. PR4 adds main-only manual signing with run/artifact/commit/hash provenance, pinned official bundletool, expected certificate and strict jarsigner verification. Review found download-artifact extraction path; corrected merge-multiple:true. Native app source remains unchanged.
- Signing run42443822131 SUCCESS, artifact13602563414; signed AAB SHA256189cc3c52f517de75d5e5dc095e6a068d1fa5bce690015dc53c9beb7eb838d40. All pre-sign payloads byte-identical. Temporary private local copies removed after successful signing from encrypted GitHub secrets.
- Google Play app created and signed AAB uploaded, processing/release still to verify. Selecting a specific account as tester requires separate recipient/scope confirmation: auto-review rejected saving tester-list assignment. No retry or indirect activation.
