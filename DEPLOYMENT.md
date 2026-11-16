# Deployment

This document describes how AdGuard Browser Extension builds are prepared and
deployed. It covers **all** build/deploy pipelines (beta, release, and the two
Firefox beta variants), plus the manual steps for preparing a new release.

- [Pipelines (GitHub Actions)](#pipelines-github-actions)
- [Release flow](#release-flow)
- [Artifact naming and compatibility](#artifact-naming-and-compatibility)
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
| PR checks + QA builds | `ci.yml` | pull_request / push to master |
| E2E tests | `e2e.yml` | pull_request |
| Release prep | `prepare-release.yml` | manual, semver tag `vX.Y.Z[-beta.N]` + optional build override and CWS rollout percentage |
| Publish (beta + release) | `publish-release.yml` | merged `release-bump/*` PR / manual |
| Filters auto-update + CWS/Edge auto-publish | `auto-build.yml` | schedule 12:00/17:00 UTC + manual |

Release flow:

1. Run `prepare-release.yml` with the target semver tag (e.g. `v5.6.0-beta.7`).
   By default, it consumes the next build number, bumps `package.json` to
   `5.6.0+7.build.<dnrPatch>` and adds the `## [5.6.0.7-beta]` CHANGELOG heading
   with a compare link (the base tag is selected by `selectPreviousTag`; see
   `tools/release/version.ts`).
   If a stable branch has a higher counter, enter a build override greater
   than the highest counter on both branches and use it as the beta suffix.
   The workflow rejects requested tags that already exist on origin. For a
   beta, it also rejects an existing plain release tag with the same `X.Y.Z`.
   A release tag has no build suffix (e.g. `v5.6.0`). Without an override, its
   manifest build is the next counter value, so a release prepared after
   `v5.6.0-beta.7` gets the `5.6.0.8` manifest.
   The `rollout-percentage` input sets the Chrome Web Store release-channel
   rollout: an integer from 1 to 100, 1 by default.
2. Merge the `release-bump/*` PR. To change the rollout percentage, edit the
   `Chrome Web Store rollout: N%` line in the PR body before merging.
3. `publish-release.yml` builds the main artifacts, creates the tag, and deploys:
   - beta: static.adtidy.org (chromium CRX/ZIP + Edge MV3 + Firefox
     XPI/update.json), Chrome Web Store MV3, Firefox AMO beta, Firefox
     standalone signing, GitHub Release draft (public repo, marked as
     prerelease)
   - release: static.adtidy.org (chromium + Edge MV3 + Firefox), Chrome Web
     Store MV3, Firefox AMO, Edge Add-ons (draft upload; submission is manual),
     GitHub Release draft (public repo)
   - Opera zips ship as GitHub Release assets only (store submission is manual).
   - Chrome Web Store versions are staged on both channels: after review,
     publish them manually from the Developer Dashboard.
   - Chrome Web Store release channel: the version is submitted with the
     rollout percentage from the `release-bump` PR body and starts at that
     percentage once published. The store fixes the percentage at submission;
     it cannot be chosen at publish time. A PR without the rollout line gets
     1%. A manual `publish-release.yml` dispatch can set `rollout-percentage`,
     which overrides the PR body; an empty value on a dispatch gives 1%.
     Before publishing, check the percentage of the version in review in the
     Developer Dashboard. If it is not the expected one, cancel the review and
     submit the version again from the dashboard. Raise a published
     percentage toward 100 in the Developer Dashboard.
4. Slack notifications go to `#adguard-extension-vcs`.
5. After the workflow completes, review the notes and assets in the
   `AdguardTeam/AdguardBrowserExtension` GitHub Release draft and publish it
   manually. Both channels stay in draft until this step; attaching signed
   Firefox beta assets also preserves the draft state.

Deploy gates are GitHub environments (approval rules); the complete list is in
[Required repository configuration](#required-repository-configuration). Each
browser's static deploy has its own environment, so static files of one browser
are approved and deployed without approving the others.

Workflow files:

- `prepare-release.yml` — opens the `release-bump/*` PR (package.json + CHANGELOG)
- `publish-release.yml` — build, tag, deploy to static/stores, prepare GitHub Release draft, notify
- `auto-build.yml` — twice-daily rulesets update + CWS/Edge auto-publish

## Required repository configuration

The workflows depend on these repository settings. Missing values surface as
mid-release runtime failures, so configure them before the first run.

**Variables** (`Settings → Secrets and variables → Actions → Variables`):

| Variable | Used by |
| --- | --- |
| `VAULT_URL` | Vault OIDC in publish / auto-build |
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
- `edge-addons-deployer` — `client-id`, `api-key` (Edge Add-ons publish)

**Environments** with approval rules: `chrome-static-beta`,
`chrome-static-release`, `edge-static-beta`, `edge-static-release`,
`firefox-static-beta`, `firefox-static-release`, `chrome-webstore-beta`,
`chrome-webstore-release`, `firefox-amo-beta`, `firefox-amo-release`,
`edge-addons-release`. The auto-publish environments
`chrome-webstore-beta-auto` / `chrome-webstore-release-auto` /
`edge-addons-auto` have no gates (full automation). All of them are declared
for the `browser-extension` repository in
`AdGuardSoftwareLimited/terraform-github` (`team_extensions.tf`).

Apply the static environments before the first publish run that uses them; a
missing environment is created by GitHub without protection rules. The previous
`beta-static` and `production-static` stay declared for now: `stable/v5.5` and
the already published tags still run a workflow that references them, and
removing them would let those runs recreate the environments without reviewers.
They are removed separately, once nothing references them.

## Release flow

`publish-release.yml` resolves the version from the first full 4-component
CHANGELOG heading (`## [M.m.p.BUILD[-beta]] - YYYY-MM-DD`) and verifies it
matches `package.json`. It builds the main channel artifacts through the
existing Docker stages before it creates the semver tag. The tag is never moved:
a re-run whose tag already points to the release commit keeps it, while a tag at
another commit fails the run. For a manual retry, dispatch on the existing tag
or its release commit and repeat the rollout percentage in the
`rollout-percentage` input: a dispatch has no release PR body, so an empty
input gives the default 1%. A ref that predates
`tools/release/resolve-rollout.ts` cannot read the input: such a dispatch
warns and submits the release at 1%. Otherwise bump the patch instead of
re-releasing.

- Beta tags (`v5.6.0-beta.7`) build the signed CRX (cert delivered as the
  `CHROME_CERT` BuildKit secret from Vault, never written to the workspace or an
  image layer) plus the Firefox standalone and AMO beta packages; only
  beta-channel jobs run.
- Release tags (`v5.6.0`) build all browser bundles; only release-channel jobs
  run. Their GitHub release notes link to the signed standalone builds on the
  beta static directory (`chrome.crx`, `firefox.xpi`) so users who cannot
  install from the stores (Chromium MV2 forks, AMO geo-blocking) can install
  and auto-update directly (AG-58823).
- Artifacts are laid out per consumer and consumed by the shared org workflows:
  `deploy-to-static.yml`, `deploy-to-chrome-web-store.yml`,
  `deploy-to-firefox-addons.yml`, `deploy-to-edge-addons.yml`,
  `create-gh-release.yml`.

## Artifact naming and compatibility

Internal build targets, output directories, CI downloads, and new GitHub
Release assets explicitly distinguish Chromium MV2 and MV3. The set of
packages published per channel is unchanged; existing releases are not renamed.

| Internal / GitHub package | Static filename | Store workflow filename |
| --- | --- | --- |
| `chrome-mv2.zip` | `chrome.zip` | `chrome.zip` (MV2 listing) |
| `chrome-mv3.zip` | `chrome-mv3.zip` | `chrome.zip` (MV3 listing) |
| `chrome-mv2.crx` (beta) | `chrome.crx` | Not submitted |
| `edge-mv2.zip` | Not published | Not submitted (GitHub Release asset only) |
| `edge-mv3.zip` | `edge-mv3.zip` | `edge.zip` |
| `opera-mv2.zip`, `opera-mv3.zip` (release) | Not published | Manual submission |
| `firefox.zip`, `firefox.xpi` | Unchanged | Existing AMO package layout |

`tools/ci/stage-deploy-artifacts.sh` copies the Docker outputs into separate
deployment directories without repacking them. Static filenames are permanent
public download URLs: notably, existing standalone Chrome installations rely
on `update.xml` pointing to `chrome.crx`. The local CRX filename is deliberately
independent of that URL. Firefox's `update.json` and `firefox.xpi` URLs also stay
unchanged.

The shared `deploy-to-chrome-web-store.yml` explicitly invokes `go-webext` with
`-f chrome.zip`; that filename is a workflow contract, not a Chrome Web Store
requirement. The Edge workflow similarly expects `edge.zip`, and the AMO
workflow expects `firefox.zip` and `source.zip`. Preserve these names at the
deployment boundary when changing internal package names. The automatic MV3
publishing workflow follows the same Chrome filename contract.

Firefox retains the separate `firefox-amo` and `firefox-standalone` build
targets, with no manifest suffix. Their existing conversion to published
Firefox filenames and signing flow remain unchanged.

## Firefox beta pipelines

Firefox beta ships in two independent variants — **standalone** (signed,
self-distributed) and **AMO** (listed, Mozilla-reviewed). Each runs as an
isolated job in `publish-release.yml` so that one never blocks the other.

### Why two Firefox beta pipelines

The standalone build is signed by Mozilla through `go-webext`, which can block
for a long time (up to ~20 minutes) while waiting for Mozilla's review — longer
than the job's `timeout-minutes: 15`. The standalone and AMO variants are two
separate build jobs with separate artifact sets, so a slow or failed standalone
signing never blocks the AMO submission, and vice versa.

### Standalone Firefox beta

Job `build-firefox-standalone` in `publish-release.yml` (beta channel only):

1. Builds `firefox.zip` via Docker target `firefox-beta-build-output`.
2. Signs with `go-webext`, producing `firefox.xpi` and `update.json` via
   Docker target `firefox-beta-sign-output` (AMO credentials from Vault).
3. Uploads the artifact to static.adtidy.org (`static-firefox-beta`) and as a
   GitHub Release asset (`gh-assets-firefox-beta`, attached after the release
   exists so the two never race).

Signing may hit the job's 15-minute timeout while waiting for Mozilla. If so,
re-run the **same** `publish-release.yml` run after Mozilla finishes signing to
download the signed `.xpi`; the tag already points to the release commit, so
the re-run keeps it instead of moving it.

### AMO Firefox beta

Job `build-firefox-amo-beta` in `publish-release.yml` (beta channel only):
builds the unsigned `firefox-amo.zip` via Docker target
`firefox-amo-beta-build-output`. AMO-listed add-ons are **not** signed locally —
Mozilla signs them during review. The artifact (`firefox.zip` + `source.zip` +
`approval-notes.txt`) is submitted to AMO via the shared
`deploy-to-firefox-addons.yml` workflow.

### How to release a Firefox beta

The beta channel of `publish-release.yml` automatically covers both Firefox
variants. Run `prepare-release.yml` with a `-beta` tag (e.g. `v5.6.0-beta.7`),
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

6. **Run `prepare-release.yml`** with the target semver tag
   (e.g. `v5.6.0-beta.7` for beta, `v5.6.0` for release). It validates the
   format and monotonicity, allocates the next build number, checks remote
   tags, sets `package.json`, patches `CHANGELOG.md` (adds the version heading
   and its compare link; the base tag follows `selectPreviousTag`), and opens
   the `release-bump/*` PR. If a stable branch has a higher counter, enter a
   build override greater than the highest counter on both branches and use it
   as the beta suffix. Set `rollout-percentage` to the Chrome Web Store
   release-channel rollout (1 to 100, default `1`).

7. **Merge the `release-bump/*` PR.** `publish-release.yml` takes over: it
   builds the main artifacts, tags the merge commit, and deploys to the
   destinations for the given channel.

## Troubleshooting

- **Standalone signing times out (15 min).** This is expected when Mozilla
  takes longer than the job's `timeout-minutes: 15`. It does **not** affect AMO.
  Re-run the `publish-release.yml` run after signing completes; it will pick up
  the signed `.xpi`. The re-run is safe
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
  reject duplicate versions on re-run. Re-runs of `publish-release.yml` keep the
  existing tag (it points to the same release commit) and rely on the documented
  idempotency of the deployer. If a store still rejects a duplicate, publish
  manually via the store dashboard.
- **A deploy job does not wait for approval.** The GitHub environments must
  exist with the exact names the workflow resolves, otherwise GitHub silently
  auto-creates the missing environment without approval gates.
- **Auto-build workflow change must be back-ported to the stable branch.** The
  scheduled run takes `auto-build.yml` from `master` but every job checks out
  `stable/v5.5`, so the Docker stages and scripts the workflow uses
  (`verify-cws`, `tools/ci/check-publish-state.sh`, `cws-publish.properties`)
  must exist on `stable/v5.5` before or atomically with the workflow change.
  Otherwise every run commits the version bump and then fails on the missing
  properties file. The order is reversed for changes that alter the publish
  gating: a Docker stage that stops failing the build (for example the CWS scope
  check, which now only skips the CWS publish and records the outcome in
  `cws-publish.properties`) must not reach `stable/v5.5` before the workflow
  that reads that outcome, or the old workflow publishes the ineligible build to
  CWS. Land such changes on `master` first and sync `stable/v5.5` afterwards.
- **Auto-build publish job failed, but the extension is in the store.** CWS
  occasionally answers HTTP 502 on the publish call after the upload already
  succeeded. The `verify-cws-*` job checks the store state right after such a
  failure, and its exit code tells the outcomes apart: `0` — the store holds the
  build, the failure was benign; `1` — the version is not in the store, the
  failure is real; `2` — the check itself failed (Vault/OIDC or CWS API error),
  so the store state is unknown and must be checked manually. There is no
  automatic standard-review fallback for a failed expedited publish. After a
  real failure, re-running the publish job may be rejected by CWS as a
  duplicate-version upload; in that case publish manually from the CWS
  dashboard.
- **Auto-build skipped the CWS publish (scope check).** The built package
  changed something the requested review may not ship: in the standard-review
  mode any file outside `filters/` compared to the published extension, and in
  the expedited mode anything outside the manifest `rule_resources` — for
  example locale updates that arrived with a master merge, or `filters/` changes
  committed by an unpublished full-resources run (see the next entry). The
  auto-build skips the CWS publish jobs, so the store keeps serving the previous
  build until a standard-review submission ships the changes. The Edge
  submission is not affected and is still made. Investigate and remove the
  out-of-scope change before the next auto-build. The generated
  `filters/local_script_rules.js` is inlined into the MV3 `pages/background.js`,
  so the check allows that bundle to change when the rules module changed as
  well; every other out-of-scope file still skips the CWS publish.
- **Auto-build failed on the ruleset declaration check.** A ruleset was added
  to or removed from `declarative_net_request.rule_resources` in the built
  manifest. The manifest is outside the change scope an auto-published build
  may touch (safe rules for skip review, files under `filters/` for the
  standard review), so the build is never published to the Chrome Web Store
  automatically: the auto-build skips the CWS publish jobs and still submits the
  build to Edge, which reviews every submission. Ship the change through the
  regular release process, or revert the ruleset update on `stable/v5.5` before
  the next auto-build.
- **Auto-build failed on the expedited scope check after an unpublished
  full-resources build.** A full-resources build commits `filters/` changes that
  only the standard review may ship, but when the CWS channel is unavailable the
  publish job is skipped, so those changes sit on `stable/v5.5` without ever
  reaching the store. Every later expedited build then fails the scope check
  because the changes are not in `rule_resources` (the expedited error in
  `tools/skip-review/check-changes-for-cws.ts` points here): the auto-build
  skips the CWS publish jobs, while the Edge submission is still made. Wait for
  the next full-resources run with an available channel: its standard-review
  submission publishes the changes and later expedited checks pass again. To
  unblock sooner, revert only the generated `filters/` changes of that run's
  `[skip ci] Rulesets update & increment patch version (autobuild-v…)` commit
  on `stable/v5.5` — they are recreated by the next full-resources run — and
  keep its `package.json` version bump: reverting it too would make the next run
  rebuild a version that has already been submitted to Edge.
- **Edge submission skipped (`InProgressSubmission`).** The product already has
  a submission in review and the Edge API refuses a publish while one is in
  flight; the upload only replaces the draft, it does not cancel the review.
  The auto-build passes `skip-if-in-progress: true`, so the run logs a
  `::notice::` that the submission is skipped and reports `state=skipped`
  instead of failing, then retries on a later run. No notification fires: the
  shared workflow skips its notify job for `slack-channel: ''`, and the
  auto-build failure notification fires on a failed run only. Check the Edge
  Partner Center only when the skip repeats for several days.
- **Chrome auto-publish pauses while the release rollout is below 100%.**
  `tools/ci/check-extension-status.sh` returns `1` by design when the published
  revision is not at 100% rollout, so `auto-build.yml` skips the Chrome release
  publish until the percentage reaches 100%. The run still builds and commits
  the filter updates and publishes Edge. Raise the percentage in the Developer
  Dashboard; the next scheduled run resumes automatically.
- **The Chrome release was submitted at 1% instead of the percentage in the
  PR.** A line in the release-bump PR body starts with
  `Chrome Web Store rollout:` but does not end with an integer from 1 to 100
  and `%`. `publish-release` logs a warning, the release still runs, and the
  Chrome version is submitted at the default 1%. The PR body is read only when
  the PR closes, so editing it after the merge has no effect. Publish the
  staged version and raise the percentage in the Developer Dashboard.
