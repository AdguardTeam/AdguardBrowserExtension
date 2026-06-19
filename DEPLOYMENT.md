# Deployment

This document describes how AdGuard Browser Extension builds are prepared and
deployed. It covers **all** build/deploy pipelines (beta, release, and the two
Firefox beta variants), plus the manual steps for preparing a new release.

- [Pipeline overview](#pipeline-overview)
- [Beta pipeline](#beta-pipeline)
- [Release pipeline](#release-pipeline)
- [Firefox beta pipelines](#firefox-beta-pipelines)
  - [Why two Firefox beta pipelines](#why-two-firefox-beta-pipelines)
  - [Standalone Firefox beta](#standalone-firefox-beta)
  - [AMO Firefox beta](#amo-firefox-beta)
  - [How to release a Firefox beta](#how-to-release-a-firefox-beta)
- [How to prepare a new release](#how-to-prepare-a-new-release)
- [Troubleshooting](#troubleshooting)

## Pipeline overview

| Type | Build plan | Deploy plan | Destinations |
| --- | --- | --- | --- |
| Beta | `ADGEXT-BEBETASPECS` | `deploy beta` | static.adtidy.org, Chrome WebStore MV3, GitHub |
| Release | `ADGEXT-BERELEASESPECS` | `deploy release` | static.adtidy.org, Chrome WebStore MV2, Chrome WebStore MV3, Addons Mozilla, Edge Add-ons, GitHub |
| Firefox standalone beta | `ADGEXT-BEFIREFOXSTANDALONEBETASPECS` | `deploy firefox standalone beta` | static.adtidy.org, GitHub |
| Firefox AMO beta | `ADGEXT-BEFIREFOXAMOBETASPECS` | `deploy firefox amo beta` | Addons Mozilla |

All Bamboo plans are defined in `bamboo-specs/` and registered in
`bamboo-specs/bamboo.yaml`.

Bamboo spec files:

- `build-beta.yaml` / `build-release.yaml` — main beta and release builds
- `build-firefox-standalone-beta.yaml` / `build-firefox-amo-beta.yaml` — Firefox variants
- `deploy-beta.yaml` / `deploy-release.yaml` — main deployments
- `deploy-firefox-standalone-beta.yaml` / `deploy-firefox-amo-beta.yaml` — Firefox variant deployments
- `permissions-*.yaml` — access control for each deploy plan

## Beta pipeline

**Build plan**: `ADGEXT-BEBETASPECS` (`browser extension - build beta`).

Two stages: **Size and locales check** (bundle size check + translations
validation), then **Build** (produces artifacts for all browsers via Docker).

**Deploy plan**: `browser extension - deploy beta` (source plan:
`ADGEXT-BEBETASPECS`).

- `static.adtidy.org` — Chrome beta extension bundles (`deploy.sh chrome-extension-beta`).
- `Chrome WebStore MV3` — publishes the MV3 beta to the Chrome Web Store experimental item.
- `GitHub` — attaches Chrome/Edge/Opera/Firefox bundles to the GitHub beta release.

## Release pipeline

**Build plan**: `ADGEXT-BERELEASESPECS` (`browser extension - build release`).

Same two-stage structure as beta (size/locales check, then build). All browsers
built: Chrome MV2, Chrome MV3, Edge, Opera, Opera MV3, Firefox AMO, Firefox
standalone.

**Deploy plan**: `browser extension - deploy release` (source plan:
`ADGEXT-BERELEASESPECS`).

- `static.adtidy.org` — Chrome and Firefox release bundles.
- `Chrome WebStore MV2` — publishes MV2 to Chrome Web Store.
- `Chrome WebStore MV3` — publishes MV3 to Chrome Web Store.
- `Addons Mozilla` — submits to Mozilla Add-ons (AMO).
- `Edge Add-ons` — submits to Microsoft Edge Add-ons.
- `GitHub` — attaches all bundles to the GitHub release.

## Firefox beta pipelines

Firefox beta ships in two independent variants — **standalone** (signed,
self-distributed) and **AMO** (listed, Mozilla-reviewed). Each has its own
build and deploy plan so that one never blocks the other.

### Why two Firefox beta pipelines

The standalone build is signed by Mozilla through `go-webext`, which can block
for a long time (up to a 20-minute CI timeout) while waiting for Mozilla's
review. Previously the standalone and AMO variants lived in a single build plan
and a single deploy plan, so a slow or failed standalone signing blocked the AMO
submission. The pipelines are now fully separated: AMO can be built and
submitted for review independently of standalone signing, and vice versa.

### Standalone Firefox beta

**Build plan**: `ADGEXT-BEFIREFOXSTANDALONEBETASPECS`
(`browser extension - build firefox standalone beta`).

- Single job **Build and Sign Standalone**:
    1. Builds `firefox.zip` via Docker target `firefox-beta-build-output`.
    2. Signs with `go-webext`, producing `firefox.xpi` and `update.json` via
       Docker target `firefox-beta-sign-output`.
- Shared artifacts: `build.txt`, `firefox.zip`, `firefox.xpi`, `update.json`.
- Signing may hit the 20-minute timeout while waiting for Mozilla. If so,
  re-run the **same** build after Mozilla finishes signing to download the
  signed `.xpi`.

**Deploy plan**: `browser extension - deploy firefox standalone beta`
(source plan: `ADGEXT-BEFIREFOXSTANDALONEBETASPECS`).

- `static.adtidy.org` → `deploy.sh firefox-extension-beta` (update channel:
  `firefox.zip`, `firefox.xpi`, `update.json`, `build.txt`).
- `GitHub` → `deploy.sh browser-extension-github-beta-firefox` (attaches
  `firefox.zip`, `firefox.xpi` to the GitHub release).

### AMO Firefox beta

**Build plan**: `ADGEXT-BEFIREFOXAMOBETASPECS`
(`browser extension - build firefox amo beta`).

- Single job **Build AMO**: builds the unsigned `firefox-amo.zip` via Docker
  target `firefox-amo-beta-build-output`. AMO-listed add-ons are **not** signed
  locally — Mozilla signs them during review.
- Shared artifacts: `build.txt`, `firefox-amo.zip`, `source.zip`,
  `approval-notes.txt`.

**Deploy plan**: `browser extension - deploy firefox amo beta`
(source plan: `ADGEXT-BEFIREFOXAMOBETASPECS`).

- `Addons Mozilla` → `deploy.sh browser-extension-amo-beta` (submits
  `firefox-amo.zip` + `source.zip` + `approval-notes.txt` for AMO review).

### How to release a Firefox beta

Both build plans have `triggers: []` and `branches.create: manually`, so they
are triggered manually in Bamboo.

1. Run the **standalone** build plan and the **AMO** build plan. They are
   independent and may run at the same time.
2. When a build plan finishes, run its corresponding deploy plan. The standalone
   and AMO deploy plans are independent — run either or both, in any order.
3. If standalone signing times out, let AMO proceed and re-run the standalone
   build once Mozilla has signed.

## How to prepare a new release

These steps apply to both beta and release builds. Where they differ, both
variants are noted.

1. **Bump library versions in `package.json`.**

   Bump the versions of any recently deployed libraries (e.g. `@adguard/tsurlfilter`,
   `@adguard/tswebextension`, `@adguard/scriptlets`):
   - **Beta**: use the `-beta` suffix (e.g. `5.5.0-beta`).
   - **Release**: use the final version (e.g. `5.5.0`).

2. **Set `TSURLFILTER_REF=""`** to disable local linking, since the libraries
   have already been deployed.

3. **Run `pnpm dev`** to ensure scriptlets are up to date.

4. **Run `pnpm resources && pnpm resources:mv3`** to update filters, public
   suffix list, and DNR rulesets.

5. **Build and check bundle size:**
   - Beta: `pnpm beta --zip`, then `pnpm check-bundle-size beta`
   - Release: `pnpm release --zip`, then `pnpm check-bundle-size release`

   If the size diff is acceptable, run `pnpm update-bundle-size beta` (or
   `release`). Otherwise investigate what caused the increase.

6. **Run `pnpm locales validate`** and, if needed, create a task for translators.

7. **Merge the PR and trigger the build in Bamboo.**

## Troubleshooting

- **Standalone signing times out (20 min).** This is expected when Mozilla is
  slow. It does **not** affect AMO. Re-run the standalone build plan after
  signing completes; it will pick up the signed `.xpi`. The re-run is safe
  because idempotency lives in `go-webext`, not in Bamboo: on the second run it
  detects the version is already uploaded to Mozilla, skips re-uploading, polls
  the signing status, and downloads the signed `.xpi`. The Bamboo plan only
  re-invokes the same signing step — there is nothing to retry at the pipeline
  level.
- **Deploy fails with a missing artifact.** The deploy plan was likely triggered
  before its source build plan finished, or the build failed. Confirm the
  source build plan produced all shared artifacts, then re-run the deploy.
- **AMO and standalone interfere.** They should not — they are separate plans
  with separate artifacts. If you see cross-contamination, verify each deploy
  plan's `source-plan` points to the matching build plan and that the build
  plans were run from the same commit/version.
- **Permissions error on a deploy plan.** The deployment `name` in the deploy
  YAML must exactly match the `deployment.name` in its permissions YAML
  (`permissions-firefox-standalone-beta.yaml` /
  `permissions-firefox-amo-beta.yaml`).
