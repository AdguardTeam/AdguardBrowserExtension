# Deployment

This document describes how AdGuard Browser Extension builds are prepared and
deployed. It covers **all** build/deploy pipelines (beta, release, and the two
Firefox beta variants), plus the manual steps for preparing a new release.

- [Pipelines (GitHub Actions)](#pipelines-github-actions)
- [Release flow](#release-flow)
- [Firefox beta pipelines](#firefox-beta-pipelines)
  - [Why two Firefox beta pipelines](#why-two-firefox-beta-pipelines)
  - [Standalone Firefox beta](#standalone-firefox-beta)
  - [AMO Firefox beta](#amo-firefox-beta)
  - [How to release a Firefox beta](#how-to-release-a-firefox-beta)
- [How to prepare a new release](#how-to-prepare-a-new-release)
- [Troubleshooting](#troubleshooting)

## Pipelines (GitHub Actions)

All builds run in Docker via the repo-root `Dockerfile` on the `team-extensions`
runner. Release/deploy flows:

| Flow | Workflow | Path |
| --- | --- | --- |
| PR checks + QA builds | `ci.yml` | pull_request / push to master + `stable/**` |
| E2E tests | `e2e.yml` | pull_request |
| Release prep | `prepare-release.yml` | manual, tag input `vM.m.p.inc[-beta]` |
| Publish (beta + release) | `publish-release.yml` | merged `release-bump/*` PR / manual |
| Filters auto-update + CWS auto-publish | `auto-build.yml` | schedule 00:30/12:30 UTC + manual |

Release flow:

1. Run `prepare-release.yml` with the target tag (e.g. `v5.6.0.1-beta`).
   It bumps `package.json` to `5.6.0+1.build.<dnrPatch>` and adds the
   `## [5.6.0.1-beta]` CHANGELOG heading.
2. Merge the `release-bump/*` PR.
3. `publish-release.yml` tags, builds, and deploys:
   - beta: static.adtidy.org (chromium CRX/ZIP + Firefox XPI/update.json),
     Chrome Web Store MV3, Firefox AMO beta, Firefox standalone signing,
     GitHub Release (public repo, prerelease)
   - release: static.adtidy.org (chromium + Firefox), Chrome Web Store MV2+MV3,
     Firefox AMO, Edge Add-ons, GitHub Release (public repo)
   - Opera zips ship as GitHub Release assets only (store submission is manual).
4. Slack notifications go to `#adguard-extension-vcs`.

Releasing from a stable branch (e.g. `stable/v5.5`):

- `prepare-release.yml`: set the workflow `Ref` to the stable branch and set
  the `base` input to the same branch, so the `release-bump/*` PR targets
  `stable/v5.5` instead of `master`.
- After merging, `publish-release.yml` runs automatically — its trigger covers
  merged PRs into `master` and `stable/**` — and deploys using the merged
  PR's commit. The version check in `prepare-release.ts` compares against the
  checked-out branch's `package.json`, so a 5.5.x candidate is accepted when
  the workflow runs on `stable/v5.5`.

Deploy gates are GitHub environments (approval rules): `beta-static`,
`production-static`, `chrome-webstore-beta`, `chrome-webstore-release`,
`firefox-amo-beta`, `firefox-amo-release`, `edge-addons-release`. The
auto-publish environments `chrome-webstore-beta-auto` /
`chrome-webstore-release-auto` have no gates (full automation).

Workflow files:

- `prepare-release.yml` — opens the `release-bump/*` PR (package.json + CHANGELOG)
- `publish-release.yml` — tag, build, deploy to static/stores/GitHub, notify
- `auto-build.yml` — 12h rulesets update + CWS auto-publish

## Required repository configuration

The workflows depend on these repository settings. Missing values surface as
mid-release runtime failures, so configure them before the first run.

**Variables** (`Settings → Secrets and variables → Actions → Variables`):

| Variable | Used by |
| --- | --- |
| `VAULT_URL` | Vault OIDC in publish / auto-build |
| `CHROME_WEBSTORE_MV2_ITEM_ID` | CWS MV2 publish |
| `CHROME_WEBSTORE_MV3_ITEM_ID` | CWS MV3 publish (release) |
| `CHROME_WEBSTORE_MV3_BETA_ITEM_ID` | CWS MV3 publish (beta) |
| `EDGE_ADDONS_PRODUCT_ID` | Edge Add-ons publish |
| `RELEASE_BOT_NAME` / `RELEASE_BOT_EMAIL` / `RELEASE_BOT_USER_ID` | release bot identity (defaults to `adguard-octobuddy[bot]` / `285975488`) |

**Vault roles** (`secret/data/ci-secrets/<role>`, via OIDC:

- `extensions-private-browser-extension` — `UNTRUSTED_certificate` (CRX signing),
  `tokenguard_api_key` (dangerous-rules check in auto-build)
- `firefox-amo-deployer` — `client-id`, `client-secret` (Firefox signing / AMO)
- `chrome-webstore-deployer` — `client-id`, `client-secret`, `refresh-token`,
  `publisher-id` (CWS status + auto-publish)

**Environments** with approval rules: `beta-static`, `production-static`,
`chrome-webstore-beta`, `chrome-webstore-release`, `firefox-amo-beta`,
`firefox-amo-release`, `edge-addons-release`.

## Release flow

`publish-release.yml` resolves the version from the first full 4-component
CHANGELOG heading (`## [M.m.p.inc[-beta]] - YYYY-MM-DD`), verifies it matches
`package.json`, force-tags the commit, and builds channel artifacts through the
existing Docker stages.

- Beta tags (`v5.6.0.1-beta`) build the signed CRX (cert delivered as the
  `CHROME_CERT` BuildKit secret from Vault, never written to the workspace or an
  image layer) plus the Firefox standalone and AMO beta packages; only
  beta-channel jobs run.
- Release tags (`v5.6.0.1`) build all browser bundles; only release-channel
  jobs run.
- Artifacts are laid out per consumer and consumed by the shared org workflows:
  `deploy-to-static.yml`, `deploy-to-chrome-web-store.yml`,
  `deploy-to-firefox-addons.yml`, `deploy-to-edge-addons.yml`,
  `create-gh-release.yml`.

## Firefox beta pipelines

Firefox beta ships in two independent variants — **standalone** (signed,
self-distributed) and **AMO** (listed, Mozilla-reviewed). Each runs as an
isolated job in `publish-release.yml` so that one never blocks the other.

### Why two Firefox beta pipelines

The standalone build is signed by Mozilla through `go-webext`, which can block
for a long time (up to a 20-minute CI timeout) while waiting for Mozilla's
review. The standalone and AMO variants are two separate build jobs with
separate artifact sets, so a slow or failed standalone signing never blocks the
AMO submission, and vice versa.

### Standalone Firefox beta

Job `build-firefox-standalone` in `publish-release.yml` (beta channel only):

1. Builds `firefox.zip` via Docker target `firefox-beta-build-output`.
2. Signs with `go-webext`, producing `firefox.xpi` and `update.json` via
   Docker target `firefox-beta-sign-output` (AMO credentials from Vault).
3. Uploads the artifact to static.adtidy.org (`static-firefox-beta`) and as a
   GitHub Release asset (`gh-assets-firefox-beta`, attached after the release
   exists so the two never race).

Signing may hit the 20-minute timeout while waiting for Mozilla. If so, re-run
the **same** `publish-release.yml` run (force-retag) after Mozilla finishes
signing to download the signed `.xpi`.

### AMO Firefox beta

Job `build-firefox-amo-beta` in `publish-release.yml` (beta channel only):
builds the unsigned `firefox-amo.zip` via Docker target
`firefox-amo-beta-build-output`. AMO-listed add-ons are **not** signed locally —
Mozilla signs them during review. The artifact (`firefox.zip` + `source.zip` +
`approval-notes.txt`) is submitted to AMO via the shared
`deploy-to-firefox-addons.yml` workflow.

### How to release a Firefox beta

The beta channel of `publish-release.yml` automatically covers both Firefox
variants. Run `prepare-release.yml` with a `-beta` tag (e.g. `v5.6.0.1-beta`),
merge the resulting `release-bump/*` PR, and let `publish-release.yml` run. The
standalone and AMO jobs run independently and never block each other; if
standalone signing times out, AMO proceeds and the standalone run can be
re-triggered once Mozilla has signed.

## How to prepare a new release

These steps apply to both beta and release builds. Where they differ, both
variants are noted.

1. **Bump library versions in `package.json` and validate locally.**

   Bump the versions of any recently deployed libraries (e.g. `@adguard/tsurlfilter`,
   `@adguard/tswebextension`, `@adguard/scriptlets`):
   - **Beta**: use the `-beta` suffix (e.g. `5.5.0-beta`).
   - **Release**: use the final version (e.g. `5.5.0`).

2. **Run `pnpm dev`** to ensure scriptlets are up to date.

3. **Run `pnpm resources && pnpm resources:mv3`** to update filters, public
   suffix list, and DNR rulesets.

4. **Build and check bundle size:**
   - Beta: `pnpm beta --zip`, then `pnpm check-bundle-size beta`
   - Release: `pnpm release --zip`, then `pnpm check-bundle-size release`

   If the size diff is acceptable, run `pnpm update-bundle-size beta` (or
   `release`). Otherwise investigate what caused the increase.

5. **Run `pnpm locales validate`** and, if needed, create a task for translators.

6. **Run `prepare-release.yml`** with the target 4-component tag
   (e.g. `v5.6.0.1-beta` for beta, `v5.6.0.1` for release). It validates the
   format and monotonicity, sets `package.json`, patches `CHANGELOG.md`, and
   opens the `release-bump/*` PR. For a stable release, additionally set the
   workflow `Ref` and the `base` input to the stable branch
   (e.g. `stable/v5.5`).

7. **Merge the `release-bump/*` PR.** `publish-release.yml` takes over: it
   tags the merge commit, builds, and deploys to the destinations for the given
   channel.

## Troubleshooting

- **Standalone signing times out (20 min).** This is expected when Mozilla is
  slow. It does **not** affect AMO. Re-run the `publish-release.yml` run after
  signing completes; it will pick up the signed `.xpi`. The re-run is safe
  because idempotency lives in `go-webext`, not in the workflow: on the second
  run it detects the version is already uploaded to Mozilla, skips
  re-uploading, polls the signing status, and downloads the signed `.xpi`.
- **Deploy fails with a missing artifact.** The build job likely produced the
  wrong artifact layout, or the artifact was downloaded before the build job
  finished. Confirm the build job produced all shared artifacts under
  `output/.../artifacts/`, then re-run the workflow.
- **`resolve-version` fails with a version mismatch.** The first full-version
  CHANGELOG heading does not match `package.json`. Fix the mismatch (or run
  `prepare-release.yml` again) before any deploy happens — the workflow refuses
  to publish an inconsistent version.
- **Store upload rejected as a duplicate version.** The shared store workflows
  reject duplicate versions on re-run. Re-runs of `publish-release.yml` rely on
  the force-retag and the documented idempotency of the deployer. If a store
  still rejects a duplicate, publish manually via the store dashboard.
- **Permissions error on a deploy job.** The GitHub environments must be
  pre-created with the exact names used in the workflow, otherwise GitHub
  silently auto-creates a misspelled environment without approval gates.
