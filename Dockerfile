# ENV NODE_VERSION=22.17.0
FROM mcr.microsoft.com/playwright:v1.53.2-noble AS base
SHELL ["/bin/bash", "-lc"]

# Install dependencies
RUN apt-get update \
    && apt-get install -y git curl zip \
    # clean up
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10.33.4

# Prevent "dubious ownership" error in git
RUN git config --global --add safe.directory '*'

WORKDIR /extension

ENV PNPM_STORE=/pnpm-store

# ============================================================================
# Stage: deps
# Cached until package.json/pnpm-lock.yaml changes
# ============================================================================
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Set cache directory.
    pnpm config set store-dir /pnpm-store && \
    pnpm install \
        --frozen-lockfile \
        --prefer-offline \
        --ignore-scripts

# ============================================================================
# Stage: source-deps
# Cached until source code changes
# Has source + node_modules; all build/test stages inherit from here
# ============================================================================
FROM deps AS source-deps

COPY . /extension

# ============================================================================
# Stage: linked-deps-playwright
# Installs Playwright browsers once; all test stages inherit from here.
# ============================================================================
FROM source-deps AS linked-deps-playwright

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    pnpm config set store-dir /pnpm-store && \
    pnpm exec playwright install

# ============================================================================
# Stage: dev-build
# Creates dev build with zip files for CI artifacts
# ============================================================================
FROM source-deps AS dev-build

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so test/lint/build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create dev build with zip files for CI artifacts.
    # Note: no -- separator needed, options work with subcommand.
    pnpm dev --zip && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move all artifacts to the artifacts directory.
    mv build/dev/build.txt /out/artifacts/ && \
    # Add postfix to all zip files for easier identification target env.
    mv build/dev/chrome.zip /out/artifacts/chrome-dev.zip && \
    mv build/dev/chrome-mv3.zip /out/artifacts/chrome-mv3-dev.zip && \
    mv build/dev/edge.zip /out/artifacts/edge-dev.zip && \
    mv build/dev/firefox-amo.zip /out/artifacts/firefox-amo-dev.zip && \
    mv build/dev/firefox-standalone.zip /out/artifacts/firefox-standalone-dev.zip && \
    mv build/dev/opera.zip /out/artifacts/opera-dev.zip && \
    mv build/dev/opera-mv3.zip /out/artifacts/opera-mv3-dev.zip

FROM scratch AS dev-build-output
COPY --from=dev-build /out/ /

# ============================================================================
# Stage: chrome-crx
# Creates Chrome CRX build
# ============================================================================
FROM source-deps AS chrome-crx

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so test/lint/build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create dev build.
    pnpm dev chrome-crx && \
    # Create artifacts directory first thing to ensure it exists.
    mkdir -p /out/artifacts && \
    # Add postfix to the built file for easier identification target env.
    mv build/dev/chrome.crx /out/artifacts/chrome-dev.crx

FROM scratch AS chrome-crx-output
COPY --from=chrome-crx /out/ /

# ============================================================================
# Stage: lint
# Runs linting
# ============================================================================
FROM source-deps AS lint

# `COPY . /extension` in source-deps invalidates this stage on every commit, so
# the ESLint and TypeScript incremental caches are kept in BuildKit cache mounts:
# stable ids persist them on the shared BuildKit between builds (same mechanism
# as the pnpm store above) even though the layer itself is rebuilt. The cache
# paths match the ones configured in package.json / tsconfig.mv2|mv3.json.
RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    --mount=type=cache,target=/extension/.cache/eslint,id=browser-extension-eslint \
    --mount=type=cache,target=/extension/.cache/tsc,id=browser-extension-tsc \
    # Run lint with timeout (cached until source changes).
    ./tools/ci/timeout-wrapper.sh 240s pnpm lint && \
    mkdir -p /out && \
    touch /out/lint.txt

# Image for linter output so that when running linter in CI we could get only
# the test results.
FROM scratch AS lint-output
COPY --from=lint /out/ /

# ============================================================================
# Stage: unit-tests
# Runs unit tests during build
# IMPORTANT: Cannot be cached - tests must run on every build to catch
# regressions. TEST_RUN_ID busts cache on every build.
# ============================================================================
FROM source-deps AS unit-tests

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Disable errexit first so failures below are recorded in exit-code.txt
    # instead of aborting the RUN before /out is created (which would surface
    # as a misleading "COPY /out: not found" in the output stage).
    set +e; \
    # Bust build cache so test stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id; \
    # Create the reports directory unconditionally so the output stage can
    # always copy it, even when the tests fail. If it cannot be created, fail
    # the RUN so the real error is not masked by "COPY /out: not found".
    mkdir -p /out/tests-reports || { echo "Failed to create /out/tests-reports" >&2; exit 1; }; \
    # Run unit tests with timeout.
    ./tools/ci/timeout-wrapper.sh 600s pnpm test:ci; \
    EXIT_CODE=$?; \
    # Keep tests-reports for junit parser.
    if [ -d tests-reports ]; then \
      cp -R tests-reports/. /out/tests-reports/; \
    fi; \
    # Note that we export test-results in junit format (for CI to understand)
    # and suppress the original exit code (so that we could get the test results).
    # See .github/workflows to understand how exit-code.txt is used.
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

# Image for tester output so that when running tests in CI we could get only
# the test results.
FROM scratch AS unit-tests-output
COPY --from=unit-tests /out/ /

# ============================================================================
# Stage: integration-tests
# Runs integration tests for a given BUILD_TYPE (dev, beta, release)
# Expects artifacts/chrome-mv3-<BUILD_TYPE>.zip via the `chrome-artifacts`
# named build context (--build-context chrome-artifacts=artifacts)
# ============================================================================
FROM linked-deps-playwright AS integration-tests

ARG BUILD_TYPE

COPY --from=chrome-artifacts . /extension/artifacts/

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Disable errexit first so failures below are recorded in exit-code.txt
    # instead of aborting the RUN before /out is created (which would surface
    # as a misleading "COPY /out: not found" in the output stage).
    set +e; \
    # Bust build cache so test/lint/build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id; \
    # Create the reports directory unconditionally so the output stage can
    # always copy it, even when the build artifact cannot be prepared. If it
    # cannot be created, fail the RUN so the real error is not masked by
    # "COPY /out: not found".
    mkdir -p /out/tests-reports || { echo "Failed to create /out/tests-reports" >&2; exit 1; }; \
    mkdir -p build/${BUILD_TYPE}; \
    # Move artifact to build directory, because integration tests expect it there.
    mv /extension/artifacts/chrome-mv3-${BUILD_TYPE}.zip /extension/build/${BUILD_TYPE}/chrome-mv3.zip; \
    BUILD_EXIT_CODE=$?; \
    if [ "${BUILD_EXIT_CODE}" -ne 0 ]; then \
      echo "Preparing build artifacts failed with exit code ${BUILD_EXIT_CODE}; skipping tests." >&2; \
      echo "${BUILD_EXIT_CODE}" > /out/exit-code.txt; \
      exit 0; \
    fi; \
    # Run integration tests.
    pnpm test:integration ${BUILD_TYPE}; \
    EXIT_CODE=$?; \
    if [ -d tests-reports ]; then \
      cp -R tests-reports/. /out/tests-reports/; \
    fi; \
    # Rename test report to match JUnit parser pattern.
    if [ -f /out/tests-reports/integration-tests.xml ]; then \
        mv /out/tests-reports/integration-tests.xml /out/tests-reports/integration-tests-${BUILD_TYPE}.xml; \
    fi; \
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

FROM scratch AS integration-tests-output
COPY --from=integration-tests /out/ /

# ============================================================================
# Stage: integration-tests-standalone
# Self-contained integration tests that build chrome-mv3 dev extension
# internally, without requiring pre-built artifacts from another job.
# Used by the tests plan where all jobs run in a single parallel stage.
# ============================================================================
FROM linked-deps-playwright AS integration-tests-standalone

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Disable errexit first so failures below are recorded in exit-code.txt
    # instead of aborting the RUN before /out is created (which would surface
    # as a misleading "COPY /out: not found" in the output stage).
    set +e; \
    # Bust build cache so test stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id; \
    # Create the reports directory unconditionally before the build so the
    # output stage can always copy it, even when the build fails. If it cannot
    # be created, fail the RUN so the real error is not masked by
    # "COPY /out: not found".
    mkdir -p /out/tests-reports || { echo "Failed to create /out/tests-reports" >&2; exit 1; }; \
    # Build only chrome-mv3 dev extension with zip.
    pnpm dev chrome-mv3 --zip; \
    BUILD_EXIT_CODE=$?; \
    if [ "${BUILD_EXIT_CODE}" -ne 0 ]; then \
      echo "Build failed with exit code ${BUILD_EXIT_CODE}; skipping tests." >&2; \
      echo "${BUILD_EXIT_CODE}" > /out/exit-code.txt; \
      exit 0; \
    fi; \
    # Run integration tests.
    pnpm test:integration dev; \
    EXIT_CODE=$?; \
    if [ -d tests-reports ]; then \
      cp -R tests-reports/. /out/tests-reports/; \
    fi; \
    # Rename test report to match JUnit parser pattern.
    if [ -f /out/tests-reports/integration-tests.xml ]; then \
        mv /out/tests-reports/integration-tests.xml /out/tests-reports/integration-tests-dev.xml; \
    fi; \
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

FROM scratch AS integration-tests-standalone-output
COPY --from=integration-tests-standalone /out/ /

# ============================================================================
# Stage: e2e-tests-standalone
# Self-contained E2E tests that build Chrome MV2, Chrome MV3, and Firefox
# MV2 dev extensions internally, without requiring artifacts from another job.
# ============================================================================
FROM linked-deps-playwright AS e2e-tests-standalone

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Disable errexit first so failures below are recorded in exit-code.txt
    # instead of aborting the RUN before /out is created (which would surface
    # as a misleading "COPY /out: not found" in the output stage).
    set +e; \
    # Bust build cache so test stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id; \
    # Create the reports directory unconditionally before the build so the
    # output stage can always copy it, even when the build fails. If it cannot
    # be created, fail the RUN so the real error is not masked by
    # "COPY /out: not found".
    mkdir -p /out/tests-reports || { echo "Failed to create /out/tests-reports" >&2; exit 1; }; \
    # Build only E2E target dev extensions with zip artifacts.
    pnpm dev chrome --zip && \
    pnpm dev chrome-mv3 --zip && \
    pnpm dev firefox-standalone --zip; \
    BUILD_EXIT_CODE=$?; \
    if [ "${BUILD_EXIT_CODE}" -ne 0 ]; then \
      echo "Build failed with exit code ${BUILD_EXIT_CODE}; skipping tests." >&2; \
      echo "${BUILD_EXIT_CODE}" > /out/exit-code.txt; \
      exit 0; \
    fi; \
    # Run E2E tests.
    E2E_HEADLESS=true pnpm test:e2e dev; \
    EXIT_CODE=$?; \
    if [ -d tests-reports ]; then \
        cp -R tests-reports/. /out/tests-reports/; \
    fi; \
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

FROM scratch AS e2e-tests-standalone-output
COPY --from=e2e-tests-standalone /out/ /

# ============================================================================
# Stage: beta-build
# Creates beta build with zip files for CI artifacts
# Requires CHROME_CERT BuildKit secret (production CRX signing certificate)
# ============================================================================
FROM source-deps AS beta-build

# The production CRX signing certificate is exposed via the CHROME_CERT BuildKit
# secret (never COPYed from a build context) so the key never lands in a cached
# image layer. It is materialized at the path tools/constants.ts expects.
ARG TEST_RUN_ID

RUN --mount=type=secret,id=CHROME_CERT,required=true \
    --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Materialize the signing certificate from the BuildKit secret, consume it
    # during the build, then remove it so no trace survives in the layer.
    mkdir -p /extension/private/AdguardBrowserExtension && \
    cat /run/secrets/CHROME_CERT > /extension/private/AdguardBrowserExtension/certificate.pem && \
    # Create beta build with zip files for CI artifacts.
    pnpm beta --zip && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move all artifacts to the artifacts directory.
    mv build/beta/build.txt /out/artifacts/ && \
    mv build/beta/chrome.zip /out/artifacts/ && \
    mv build/beta/chrome-mv3.zip /out/artifacts/ && \
    mv build/beta/edge.zip /out/artifacts/ && \
    # Leave no trace of the private key in this image layer.
    rm -rf /extension/private

FROM scratch AS beta-build-output
COPY --from=beta-build /out/ /

# ============================================================================
# Stage: beta-chrome-crx
# Creates Chrome CRX for beta build
# Requires CHROME_CERT BuildKit secret (production CRX signing certificate)
# ============================================================================
FROM source-deps AS beta-chrome-crx

# Certificate arrives via the CHROME_CERT BuildKit secret (see beta-build).
ARG TEST_RUN_ID

RUN --mount=type=secret,id=CHROME_CERT,required=true \
    --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Materialize the signing certificate from the BuildKit secret, consume it
    # during the build, then remove it so no trace survives in the layer.
    mkdir -p /extension/private/AdguardBrowserExtension && \
    cat /run/secrets/CHROME_CERT > /extension/private/AdguardBrowserExtension/certificate.pem && \
    # Create beta CRX build.
    pnpm beta chrome-crx && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move CRX and update.xml to artifacts.
    mv build/beta/chrome.crx /out/artifacts/ && \
    mv build/beta/update.xml /out/artifacts/ && \
    # Leave no trace of the private key in this image layer.
    rm -rf /extension/private

FROM scratch AS beta-chrome-crx-output
COPY --from=beta-chrome-crx /out/ /

# ============================================================================
# Stage: bundle-size-check
# Checks bundle sizes for specified build type (beta or release)
# ============================================================================
FROM source-deps AS bundle-size-check

ARG BUILD_TYPE

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Run build with zip files (cached until source changes).
    pnpm ${BUILD_TYPE} --zip && \
    # Check bundle sizes.
    pnpm check-bundle-size ${BUILD_TYPE} && \
    mkdir -p /out && \
    touch /out/bundle-size-check.txt

FROM scratch AS bundle-size-check-output
COPY --from=bundle-size-check /out/ /

# ============================================================================
# Stage: locales-check
# Validates translation files
# ============================================================================
FROM source-deps AS locales-check

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Validate locales (cached until source changes).
    pnpm locales validate --min && \
    mkdir -p /out && \
    touch /out/locales-check.txt

FROM scratch AS locales-check-output
COPY --from=locales-check /out/ /

# ============================================================================
# Stage: firefox-beta-build
# Creates Firefox beta build with zip files and source archive for AMO
# ============================================================================
FROM source-deps AS firefox-beta-build

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create beta build for Firefox standalone with zip archive.
    pnpm beta firefox-standalone --zip && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move artifacts to the artifacts directory.
    mv build/beta/build.txt /out/artifacts/ && \
    # Rename firefox-standalone.zip to firefox.zip (AG-41656 workaround).
    mv build/beta/firefox-standalone.zip /out/artifacts/firefox.zip && \
    # Copy update.json for Firefox standalone self-distribution.
    mv build/beta/update.json /out/artifacts/ && \
    # Archive source files for AMO publishing.
    ./tools/ci/archive-source.sh beta && \
    mv build/beta/source.zip /out/artifacts/ && \
    mv build/beta/approval-notes.txt /out/artifacts/

FROM scratch AS firefox-beta-build-output
COPY --from=firefox-beta-build /out/ /

# ============================================================================
# Stage: firefox-beta-sign
# Signs Firefox standalone beta with go-webext (requires AMO credentials)
# Expects artifacts via named build context: --build-context firefox-artifacts=artifacts
# Uses adguard/extension-builder image which has go-webext pre-installed
# ============================================================================
FROM adguard/extension-builder:22.22--0.4.1--0 AS firefox-beta-sign

WORKDIR /sign

# Copy artifacts from named build context (passed via --build-context firefox-artifacts=...)
COPY --from=firefox-artifacts firefox.zip /sign/firefox.zip
COPY --from=firefox-artifacts source.zip /sign/source.zip
COPY --from=firefox-artifacts build.txt /sign/build.txt
COPY --from=firefox-artifacts approval-notes.txt /sign/approval-notes.txt
COPY --from=firefox-artifacts update.json /sign/update.json

# Untrusted values serve only as non-secret input; deliver via BuildKit secret
# so they do not appear in image metadata/history on the shared runner.
ARG TEST_RUN_ID

# Bust build cache so signing always reruns.
RUN --mount=type=secret,id=FIREFOX_CLIENT_ID,required=true \
    --mount=type=secret,id=FIREFOX_CLIENT_SECRET,required=true \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/artifacts && \
    # Sign the Firefox standalone beta extension with go-webext.
    FIREFOX_CLIENT_ID="$(cat /run/secrets/FIREFOX_CLIENT_ID)" \
    FIREFOX_CLIENT_SECRET="$(cat /run/secrets/FIREFOX_CLIENT_SECRET)" \
    # Note that this command will fail after timeout if signing is not completed
    # (this is expected behavior).
    # After timeout and rerun same build it will download signed extension
    # and finish successfully.
    go-webext -v sign firefox -f 'firefox.zip' -s 'source.zip' -o 'firefox.xpi' \
        -n "$(cat approval-notes.txt)" && \
    # Copy all artifacts to output.
    cp build.txt /out/artifacts/ && \
    cp firefox.zip /out/artifacts/ && \
    cp firefox.xpi /out/artifacts/ && \
    cp update.json /out/artifacts/ && \
    cp source.zip /out/artifacts/

FROM scratch AS firefox-beta-sign-output
COPY --from=firefox-beta-sign /out/ /

# ============================================================================
# Stage: firefox-amo-beta-build
# Creates Firefox AMO beta build with unsigned zip and AMO review artifacts
# ============================================================================
FROM source-deps AS firefox-amo-beta-build

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create beta build for Firefox AMO with zip archive.
    pnpm beta firefox-amo --zip && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move artifacts to the artifacts directory.
    mv build/beta/build.txt /out/artifacts/ && \
    mv build/beta/firefox-amo.zip /out/artifacts/ && \
    # Archive source files for AMO publishing.
    ./tools/ci/archive-source.sh beta && \
    mv build/beta/source.zip /out/artifacts/ && \
    mv build/beta/approval-notes.txt /out/artifacts/

FROM scratch AS firefox-amo-beta-build-output
COPY --from=firefox-amo-beta-build /out/ /

# ============================================================================
# Stage: release-build
# Creates release build with zip files for CI artifacts
# ============================================================================
FROM source-deps AS release-build

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create release build with zip files for CI artifacts.
    pnpm release --zip && \
    # Archive source files for AMO publishing.
    ./tools/ci/archive-source.sh release && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move all artifacts to the artifacts directory.
    mv build/release/build.txt /out/artifacts/ && \
    mv build/release/chrome.zip /out/artifacts/ && \
    mv build/release/chrome-mv3.zip /out/artifacts/ && \
    mv build/release/edge.zip /out/artifacts/ && \
    mv build/release/opera.zip /out/artifacts/ && \
    mv build/release/opera-mv3.zip /out/artifacts/ && \
    # TODO: (AG-41656) Remove this workaround and use the browser name as for all other builds.
    mv build/release/firefox-amo.zip /out/artifacts/firefox.zip && \
    mv build/release/source.zip /out/artifacts/ && \
    mv build/release/approval-notes.txt /out/artifacts/

FROM scratch AS release-build-output
COPY --from=release-build /out/ /

# ============================================================================
# Stage: check-cws
# Checks Chrome Web Store availability for beta and release channels
# Uses adguard/extension-builder which has go-webext pre-installed
# ============================================================================
FROM adguard/extension-builder:22.22--0.4.1--0 AS check-cws

WORKDIR /check

COPY tools/ci/check-extension-status.sh ./
COPY tools/ci/cws-status-lib.sh ./

# CWS item IDs come from the same repo vars the publish jobs use
# (CHROME_WEBSTORE_MV3(_BETA)_ITEM_ID), so the availability guard and the
# publish jobs cannot drift apart after a listing migration.
# CHROME_CLIENT_ID / CHROME_PUBLISHER_ID arrive as BuildKit secrets (no ARG).
ARG CWS_BETA_ITEM_ID
ARG CWS_RELEASE_ITEM_ID
ARG TEST_RUN_ID

RUN --mount=type=secret,id=CHROME_CLIENT_ID,required=true \
    --mount=type=secret,id=CHROME_PUBLISHER_ID,required=true \
    --mount=type=secret,id=CHROME_CLIENT_SECRET,required=true \
    --mount=type=secret,id=CHROME_REFRESH_TOKEN,required=true \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/artifacts && \
    echo "false" > /tmp/beta_available && \
    echo "false" > /tmp/release_available && \
    check_channel() { \
      CHROME_CLIENT_ID="$(cat /run/secrets/CHROME_CLIENT_ID)" \
      CHROME_CLIENT_SECRET="$(cat /run/secrets/CHROME_CLIENT_SECRET)" \
      CHROME_REFRESH_TOKEN="$(cat /run/secrets/CHROME_REFRESH_TOKEN)" \
      CHROME_PUBLISHER_ID="$(cat /run/secrets/CHROME_PUBLISHER_ID)" \
      CHROME_API_VERSION=v2 \
      CWS_BETA_ITEM_ID="${CWS_BETA_ITEM_ID}" \
      CWS_RELEASE_ITEM_ID="${CWS_RELEASE_ITEM_ID}" \
      ./check-extension-status.sh "$1"; \
      ec=$?; \
      if [ "${ec}" -ge 2 ]; then \
        echo "❌ CWS check for the ${1} channel failed with a hard error (exit ${ec})"; \
        return "${ec}"; \
      fi; \
      # Exit 1 means "channel not available" (e.g. under review) - not a failure.
      [ "${ec}" -eq 0 ] && echo "true" > "/tmp/${1}_available"; \
      return 0; \
    }; \
    check_channel beta && check_channel release && \
    BETA_AVAILABLE=$(cat /tmp/beta_available) && \
    RELEASE_AVAILABLE=$(cat /tmp/release_available) && \
    echo "betaChannelAvailable=${BETA_AVAILABLE}" > /out/artifacts/cws-availability.properties && \
    echo "releaseChannelAvailable=${RELEASE_AVAILABLE}" >> /out/artifacts/cws-availability.properties && \
    cat /out/artifacts/cws-availability.properties && \
    if [ "${BETA_AVAILABLE}" = "false" ] && [ "${RELEASE_AVAILABLE}" = "false" ]; then \
        # "Both unavailable" is the normal state right after a store publish
        # (channels under review). Not a failure: filter updates still commit
        # below, the publish jobs just skip. Real check errors already failed
        # the build via the exit >= 2 propagation above.
        echo "⚠️ Both channels unavailable (likely under review), publish skipped"; \
    else \
        echo "✅ At least one channel is available, proceeding with build"; \
    fi

FROM scratch AS check-cws-output
COPY --from=check-cws /out/ /

# ============================================================================
# Stage: verify-cws
# Verifies whether a failed Chrome Web Store publish call actually landed in
# the store (CWS occasionally answers HTTP 502 after a successful publish).
# Exits non-zero when the store does not hold the expected version, so the
# auto-build workflow can tell a benign publish failure from a real one.
# Uses adguard/extension-builder which has go-webext pre-installed
# ============================================================================
FROM adguard/extension-builder:22.22--0.4.1--0 AS verify-cws

WORKDIR /verify

COPY tools/ci/check-publish-state.sh ./
COPY tools/ci/cws-status-lib.sh ./

# CWS_ITEM_ID is the same value the publish jobs use (repo vars
# CHROME_WEBSTORE_MV3(_BETA)_ITEM_ID), so the verify and publish steps cannot
# drift apart; CWS_EXPECTED_VERSION is the version from the auto-build stage.
# CHROME_CLIENT_ID / CHROME_PUBLISHER_ID arrive as BuildKit secrets (no ARG).
ARG CWS_ITEM_ID
ARG CWS_EXPECTED_VERSION
ARG TEST_RUN_ID

RUN --mount=type=secret,id=CHROME_CLIENT_ID,required=true \
    --mount=type=secret,id=CHROME_PUBLISHER_ID,required=true \
    --mount=type=secret,id=CHROME_CLIENT_SECRET,required=true \
    --mount=type=secret,id=CHROME_REFRESH_TOKEN,required=true \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    CHROME_CLIENT_ID="$(cat /run/secrets/CHROME_CLIENT_ID)" \
    CHROME_CLIENT_SECRET="$(cat /run/secrets/CHROME_CLIENT_SECRET)" \
    CHROME_REFRESH_TOKEN="$(cat /run/secrets/CHROME_REFRESH_TOKEN)" \
    CHROME_PUBLISHER_ID="$(cat /run/secrets/CHROME_PUBLISHER_ID)" \
    CHROME_API_VERSION=v2 \
    ./check-publish-state.sh "${CWS_ITEM_ID}" "${CWS_EXPECTED_VERSION}"

# ============================================================================
# Stage: auto-build
# Updates filter rulesets, increments version, builds beta+release chrome-mv3
# Outputs: artifacts (zips + build.txt + cws-publish.properties) + modified
# source files (rulesets, locales, local script rules and package.json) for git
# commit
# Used by auto-build.yml workflow
# ============================================================================
FROM source-deps AS auto-build

ARG TEST_RUN_ID
ARG BETA_CHANNEL_AVAILABLE
ARG RELEASE_CHANNEL_AVAILABLE
# Registry used by `pnpm resources:mv3` (tools/resources/update-dnr-rulesets.ts)
# to fetch the latest @adguard/dnr-rulesets. CI passes the internal Artifact
# Keeper npm registry here because npm throttles the shared CI egress IPs; the
# npm registry merely mirrors the @adguard scope, so only the dnr-rulesets
# tarball is pulled from it and the rest of the tree resolves from npm; empty
# falls back to the public npm registry.
ARG DNR_RULESETS_REGISTRY
# TokenGuard endpoint and model for the dangerous-rules check
# (tools/resources/dangerous-rules/safety-checker.ts). CI passes repository
# variables with production defaults; the guards below fail the build fast
# when they are missing instead of letting the check silently fall back to
# the hardcoded defaults in the script.
ARG TOKENGUARD_BASE_URL
ARG TOKENGUARD_MODEL
# CWS item IDs for the skip-review change check. CI must pass the same
# repository variables the publish jobs use: the downloader's fallback to the
# hardcoded IDs is the residual hazard after a CWS listing migration, because
# the check would then compare against the old listing.
ARG CWS_BETA_ITEM_ID
ARG CWS_RELEASE_ITEM_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    --mount=type=secret,id=TOKENGUARD_API_KEY \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    pnpm config set store-dir /pnpm-store && \
    # Mark time before modifications to detect changed files later.
    # We use a marker file instead of git diff to avoid copying the whole
    # .git directory into the Docker image.
    touch /tmp/.pre-update-marker && \
    # Tuesdays do a full resources update and request the standard CWS review:
    # the first Tuesday build collects the fixes made on Monday, so the build
    # may contain changes that are not eligible for skip review (mirrors the
    # Bamboo job). All other days update only the declarative rulesets and
    # request expedited (skip) review.
    if [ "$(date -u +%u)" = "2" ]; then \
        EXPEDITED=false; \
    else \
        EXPEDITED=true; \
    fi && \
    # Update rulesets.
    TOKENGUARD_API_KEY="$(cat /run/secrets/TOKENGUARD_API_KEY)" && \
    : "${TOKENGUARD_API_KEY:?TOKENGUARD_API_KEY secret not provided}" && \
    : "${TOKENGUARD_BASE_URL:?TOKENGUARD_BASE_URL build arg not provided}" && \
    : "${TOKENGUARD_MODEL:?TOKENGUARD_MODEL build arg not provided}" && \
    if [ "${EXPEDITED}" = "true" ]; then \
      TOKENGUARD_API_KEY="${TOKENGUARD_API_KEY}" pnpm resources:mv3 --skip-local-resources; \
    else \
      TOKENGUARD_API_KEY="${TOKENGUARD_API_KEY}" pnpm resources:mv3; \
    fi && \
    # Increment patch version.
    pnpm increment && \
    # Build both channels.
    pnpm beta chrome-mv3 --zip && \
    pnpm release chrome-mv3 --zip && \
    mkdir -p /out/artifacts && \
    # Compare the build with the extension currently published in CWS before
    # publishing it: an expedited build must contain only safe rule resources,
    # while a standard-review (Tuesday) build may only change files under
    # `filters/`, so the standard review never ships unexpected code changes.
    # EXPEDITED=false (Tuesday) maps to --standard-review here; the expedited
    # mode passes no flag.
    check_scope() { \
      if [ "${EXPEDITED}" = "true" ]; then \
        pnpm tsx tools/skip-review/check-changes-for-cws "$@"; \
      else \
        pnpm tsx tools/skip-review/check-changes-for-cws "$@" --standard-review; \
      fi; \
    } && \
    if [ "${BETA_CHANNEL_AVAILABLE}" = "true" ]; then \
      CWS_BETA_ITEM_ID="${CWS_BETA_ITEM_ID}" pnpm tsx tools/skip-review/download-latest-extension-mv3 beta && \
      check_scope ./tmp/extension-beta-latest ./build/beta/chrome-mv3; \
    fi && \
    if [ "${RELEASE_CHANNEL_AVAILABLE}" = "true" ]; then \
      CWS_RELEASE_ITEM_ID="${CWS_RELEASE_ITEM_ID}" pnpm tsx tools/skip-review/download-latest-extension-mv3 release && \
      check_scope ./tmp/extension-release-latest ./build/release/chrome-mv3; \
    fi && \
    # Publish mode for the workflow jobs: expedited/skip review on
    # non-Tuesdays, standard review on Tuesdays.
    echo "expedited=${EXPEDITED}" > /out/artifacts/cws-publish.properties && \
    cat /out/artifacts/cws-publish.properties && \
    # Collect build artifacts.
    mv build/beta/chrome-mv3.zip /out/artifacts/chrome-mv3-beta.zip && \
    mv build/release/chrome-mv3.zip /out/artifacts/chrome-mv3-release.zip && \
    cp build/release/build.txt /out/artifacts/ && \
    # Collect modified source files for git commit.
    # Uses marker file to find files changed by pnpm resources:mv3 and pnpm increment.
    # Build exclusion args from gitignore-excludes.txt (generated on host by generate-find-excludes.sh)
    # to skip build artifacts, node_modules, etc.
    mkdir -p /out/modified && \
    . ./tools/ci/parse-gitignore.sh gitignore-excludes.txt && \
    find . -newer /tmp/.pre-update-marker -type f "${GITIGNORE_EXCLUDE_ARGS[@]}" \
      | sed 's|^\./||' | while IFS= read -r f; do \
        mkdir -p "/out/modified/$(dirname "$f")"; \
        cp "$f" "/out/modified/$f"; \
      done

FROM scratch AS auto-build-output
COPY --from=auto-build /out/ /
