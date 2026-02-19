# ENV NODE_VERSION=22.17.0
FROM mcr.microsoft.com/playwright:v1.53.2-noble AS base
SHELL ["/bin/bash", "-lc"]

# Install dependencies
RUN apt-get update \
    && apt-get install -y git curl zip \
    # clean up
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10.7.1

# Prevent "dubious ownership" error in git
RUN git config --global --add safe.directory '*'

WORKDIR /extension

ENV PNPM_STORE=/pnpm-store

# ============================================================================
# Stage: tsurlfilter-build
# Builds tsurlfilter from source (passed via named build context)
# Cached until tsurlfilter source content changes (Docker checksums it)
# This stage builds tsurlfilter packages (~70 seconds)
# Output: /tsurlfilter with pre-built packages
# If tsurlfilter context is empty (no packages dir), skips build entirely
# ============================================================================
FROM base AS tsurlfilter-build

# Copy source from named build context (cloned on CI, no SSH needed here)
# If TSURLFILTER_REF was empty, this will be an empty directory
COPY --from=tsurlfilter . /tsurlfilter

# Only build if tsurlfilter has packages (TSURLFILTER_REF was set)
# Otherwise skip - npm versions from package.json will be used
RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    [ ! -d "/tsurlfilter/packages" ] && echo "No tsurlfilter source, using npm versions" && exit 0; \
    echo "Building tsurlfilter from source..." && \
    pnpm config set store-dir /pnpm-store && \
    cd /tsurlfilter/packages/tswebextension && \
    pnpm install && \
    npx lerna run build --scope=@adguard/tswebextension --include-dependencies && \
    npx lerna run build --scope=@adguard/dnr-rulesets --include-dependencies

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
# Has source + node_modules but NO tsurlfilter
# ============================================================================
FROM deps AS source-deps

COPY . /extension

# ============================================================================
# Stage: linked-deps
# Combines source-deps and tsurlfilter-build, runs fast linking (~2-3 seconds)
# All build stages inherit from this stage
# ============================================================================
FROM source-deps AS linked-deps

COPY --from=tsurlfilter-build /tsurlfilter /tsurlfilter

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    pnpm config set store-dir /pnpm-store && \
    ./bamboo-specs/scripts/link-tsurlfilter.sh --with-agtree --with-tsurlfilter --with-dnr-rulesets

# ============================================================================
# Stage: dev-build
# Creates dev build with zip files for CI artifacts
# ============================================================================
FROM linked-deps AS dev-build

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
    mv build/dev/opera.zip /out/artifacts/opera-dev.zip

FROM scratch AS dev-build-output
COPY --from=dev-build /out/ /

# ============================================================================
# Stage: chrome-crx
# Creates Chrome CRX build
# ============================================================================
FROM linked-deps AS chrome-crx

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
FROM linked-deps AS lint

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Run lint with timeout (cached until source changes).
    ./bamboo-specs/scripts/timeout-wrapper.sh 120s pnpm lint && \
    mkdir -p /out && \
    touch /out/lint.txt

# Image for linter output so that when running linter in CI we could get only
# the test results.
FROM scratch AS lint-output
COPY --from=lint /out/ /

# ============================================================================
# Stage: unit-tests
# Runs unit tests during build
# IMPORTANT: Cannot be cached - JUnit parser rejects test results with
# timestamps older than task start time. TEST_RUN_ID busts cache on every build.
# ============================================================================
FROM linked-deps AS unit-tests

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so test stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Run unit tests (cached until source changes).
    mkdir -p /out/tests-reports && \
    set +e; \
    # Run unit tests with timeout.
    ./bamboo-specs/scripts/timeout-wrapper.sh 300s pnpm test:ci; \
    EXIT_CODE=$?; \
    # Keep tests-reports for junit parser.
    # NOTE: touch is intentional - --output type=local preserves container mtimes,
    # so extracted XML files retain the timestamp from when they were written inside
    # the container. If the Bamboo task was queued for a while before running, those
    # timestamps predate the task start time and the JUnit parser rejects them with
    # "file was modified before task started". Touching after cp resets mtime to now.
    if [ -d tests-reports ]; then \
      cp -R tests-reports/. /out/tests-reports/ && \
      find /out/tests-reports -name '*.xml' -exec touch {} +; \
    fi; \
    # Note that we export test-results in junit format (for Bamboo to understand)
    # and suppress the original exit code (so that we could get the test results).
    # See bamboo-specs to understand how exit-code.txt is used.
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

# Image for tester output so that when running tests in CI we could get only
# the test results.
FROM scratch AS unit-tests-output
COPY --from=unit-tests /out/ /

# ============================================================================
# Stage: integration-tests
# Runs integration tests for a given BUILD_TYPE (dev, beta, release)
# Expects artifacts/chrome-mv3-<BUILD_TYPE>.zip in build context
# ============================================================================
FROM linked-deps AS integration-tests

ARG BUILD_TYPE

COPY artifacts/ /extension/artifacts/

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so test/lint/build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p build/${BUILD_TYPE} && \
    # Move artifact to build directory, because integration tests expect it there.
    mv /extension/artifacts/chrome-mv3-${BUILD_TYPE}.zip /extension/build/${BUILD_TYPE}/chrome-mv3.zip && \
    # For correct link playwright browsers.
    pnpm exec playwright install && \
    mkdir -p /out/tests-reports && \
    set +e; \
    # Run integration tests.
    pnpm test:integration ${BUILD_TYPE}; \
    EXIT_CODE=$?; \
    # NOTE: touch is intentional - --output type=local preserves container mtimes,
    # so extracted XML files retain the timestamp from when they were written inside
    # the container. If the Bamboo task was queued for a while before running, those
    # timestamps predate the task start time and the JUnit parser rejects them with
    # "file was modified before task started". Touching after cp resets mtime to now.
    if [ -d tests-reports ]; then \
      cp -R tests-reports/. /out/tests-reports/ && \
      find /out/tests-reports -name '*.xml' -exec touch {} +; \
    fi; \
    # Rename test report to match JUnit parser pattern (mirrors integration-tests.sh).
    if [ -f /out/tests-reports/integration-tests.xml ]; then \
        mv /out/tests-reports/integration-tests.xml /out/tests-reports/integration-tests-${BUILD_TYPE}.xml; \
    fi; \
    echo ${EXIT_CODE} > /out/exit-code.txt; \
    exit 0

FROM scratch AS integration-tests-output
COPY --from=integration-tests /out/ /

# ============================================================================
# Stage: beta-build
# Creates beta build with zip files for CI artifacts
# Requires private repo for certificate (passed via named build context)
# ============================================================================
FROM linked-deps AS beta-build

# Copy private repo for certificates
COPY --from=private . /extension/private

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create beta build with zip files for CI artifacts.
    pnpm beta --zip && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move all artifacts to the artifacts directory.
    mv build/beta/build.txt /out/artifacts/ && \
    mv build/beta/chrome.zip /out/artifacts/ && \
    mv build/beta/chrome-mv3.zip /out/artifacts/ && \
    mv build/beta/edge.zip /out/artifacts/

FROM scratch AS beta-build-output
COPY --from=beta-build /out/ /

# ============================================================================
# Stage: beta-chrome-crx
# Creates Chrome CRX for beta build
# Requires private repo for certificate (passed via named build context)
# ============================================================================
FROM linked-deps AS beta-chrome-crx

# Copy private repo for certificates
COPY --from=private . /extension/private

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create beta CRX build.
    pnpm beta chrome-crx && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move CRX and update.xml to artifacts.
    mv build/beta/chrome.crx /out/artifacts/ && \
    mv build/beta/update.xml /out/artifacts/

FROM scratch AS beta-chrome-crx-output
COPY --from=beta-chrome-crx /out/ /

# ============================================================================
# Stage: bundle-size-check
# Checks bundle sizes for specified build type (beta or release)
# ============================================================================
FROM linked-deps AS bundle-size-check

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
FROM linked-deps AS firefox-beta-build

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
    # Archive source files for AMO publishing.
    ./bamboo-specs/scripts/archive-source.sh beta && \
    mv build/beta/source.zip /out/artifacts/

FROM scratch AS firefox-beta-build-output
COPY --from=firefox-beta-build /out/ /

# ============================================================================
# Stage: firefox-beta-sign
# Signs Firefox extension with go-webext (requires AMO credentials)
# Expects artifacts via named build context: --build-context firefox-artifacts=artifacts
# Uses adguard/extension-builder image which has go-webext pre-installed
# ============================================================================
FROM adguard/extension-builder:22.17--0.3.0--0 AS firefox-beta-sign

WORKDIR /sign

# Copy artifacts from named build context (passed via --build-context firefox-artifacts=...)
COPY --from=firefox-artifacts firefox.zip /sign/firefox.zip
COPY --from=firefox-artifacts source.zip /sign/source.zip
COPY --from=firefox-artifacts build.txt /sign/build.txt

# AMO credentials passed as build args (non-sensitive) and secrets (sensitive)
ARG FIREFOX_CLIENT_ID
ARG TEST_RUN_ID

# Bust build cache so signing always reruns.
RUN --mount=type=secret,id=FIREFOX_CLIENT_SECRET \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/artifacts && \
    # Sign the Firefox extension with go-webext.
    FIREFOX_CLIENT_ID="${FIREFOX_CLIENT_ID}" \
    FIREFOX_CLIENT_SECRET="$(cat /run/secrets/FIREFOX_CLIENT_SECRET)" \
    # Note that this command will fail after timeout if signing is not completed
    # (this is expected behavior).
    # After timeout and rerun same build it will download signed extension
    # and finish successfully.
    go-webext -v sign firefox -f 'firefox.zip' -s 'source.zip' -o 'firefox.xpi' && \
    # Copy all artifacts to output.
    cp build.txt /out/artifacts/ && \
    cp firefox.zip /out/artifacts/ && \
    cp firefox.xpi /out/artifacts/ && \
    cp update.json /out/artifacts/ && \
    cp source.zip /out/artifacts/

FROM scratch AS firefox-beta-sign-output
COPY --from=firefox-beta-sign /out/ /

# ============================================================================
# Stage: release-build
# Creates release build with zip files for CI artifacts
# ============================================================================
FROM linked-deps AS release-build

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    # Create release build with zip files for CI artifacts.
    pnpm release --zip && \
    # Archive source files for AMO publishing.
    ./bamboo-specs/scripts/archive-source.sh release && \
    # Create artifacts directory if it doesn't exist.
    mkdir -p /out/artifacts && \
    # Move all artifacts to the artifacts directory.
    mv build/release/build.txt /out/artifacts/ && \
    mv build/release/chrome.zip /out/artifacts/ && \
    mv build/release/chrome-mv3.zip /out/artifacts/ && \
    mv build/release/edge.zip /out/artifacts/ && \
    mv build/release/opera.zip /out/artifacts/ && \
    # TODO: (AG-41656) Remove this workaround and use the browser name as for all other builds.
    mv build/release/firefox-amo.zip /out/artifacts/firefox.zip && \
    mv build/release/source.zip /out/artifacts/

FROM scratch AS release-build-output
COPY --from=release-build /out/ /

# ============================================================================
# Stage: check-cws
# Checks Chrome Web Store availability for beta and release channels
# Uses adguard/extension-builder which has go-webext pre-installed
# ============================================================================
FROM adguard/extension-builder:22.17--0.3.0--0 AS check-cws

WORKDIR /check

COPY bamboo-specs/scripts/check-extension-status.sh ./

ARG CHROME_CLIENT_ID
ARG CHROME_PUBLISHER_ID
ARG TEST_RUN_ID

RUN --mount=type=secret,id=CHROME_CLIENT_SECRET \
    --mount=type=secret,id=CHROME_REFRESH_TOKEN \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p /out/artifacts && \
    echo "false" > /tmp/beta_available && \
    echo "false" > /tmp/release_available && \
    (CHROME_CLIENT_ID="${CHROME_CLIENT_ID}" \
     CHROME_CLIENT_SECRET="$(cat /run/secrets/CHROME_CLIENT_SECRET)" \
     CHROME_REFRESH_TOKEN="$(cat /run/secrets/CHROME_REFRESH_TOKEN)" \
     CHROME_PUBLISHER_ID="${CHROME_PUBLISHER_ID}" \
     CHROME_API_VERSION=v2 \
     ./check-extension-status.sh beta && echo "true" > /tmp/beta_available || true) && \
    (CHROME_CLIENT_ID="${CHROME_CLIENT_ID}" \
     CHROME_CLIENT_SECRET="$(cat /run/secrets/CHROME_CLIENT_SECRET)" \
     CHROME_REFRESH_TOKEN="$(cat /run/secrets/CHROME_REFRESH_TOKEN)" \
     CHROME_PUBLISHER_ID="${CHROME_PUBLISHER_ID}" \
     CHROME_API_VERSION=v2 \
     ./check-extension-status.sh release && echo "true" > /tmp/release_available || true) && \
    BETA_AVAILABLE=$(cat /tmp/beta_available) && \
    RELEASE_AVAILABLE=$(cat /tmp/release_available) && \
    echo "betaChannelAvailable=${BETA_AVAILABLE}" > /out/artifacts/cws-availability.properties && \
    echo "releaseChannelAvailable=${RELEASE_AVAILABLE}" >> /out/artifacts/cws-availability.properties && \
    cat /out/artifacts/cws-availability.properties && \
    if [ "${BETA_AVAILABLE}" = "false" ] && [ "${RELEASE_AVAILABLE}" = "false" ]; then \
        echo "❌ Both channels unavailable, stopping build"; exit 1; \
    fi && \
    echo "✅ At least one channel is available, proceeding with build"

FROM scratch AS check-cws-output
COPY --from=check-cws /out/ /

# ============================================================================
# Stage: auto-build
# Updates filter rulesets, increments version, builds beta+release chrome-mv3
# Outputs: artifacts (zips + build.txt) + modified source files (rulesets,
# locales, local script rules and package.json) for git commit
# Used by auto-build.yaml plan
# ============================================================================
FROM linked-deps AS auto-build

ARG TEST_RUN_ID
ARG SKIP_REVIEW
ARG BETA_CHANNEL_AVAILABLE
ARG RELEASE_CHANNEL_AVAILABLE

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    --mount=type=secret,id=OPENAI_API_KEY \
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    pnpm config set store-dir /pnpm-store && \
    # Mark time before modifications to detect changed files later.
    # We use a marker file instead of git diff to avoid copying the whole
    # .git directory into the Docker image.
    touch /tmp/.pre-update-marker && \
    # Update rulesets.
    if [ "${SKIP_REVIEW}" = "true" ]; then \
      OPENAI_API_KEY="$(cat /run/secrets/OPENAI_API_KEY)" pnpm resources:mv3 --skip-local-resources; \
    else \
      OPENAI_API_KEY="$(cat /run/secrets/OPENAI_API_KEY)" pnpm resources:mv3; \
    fi && \
    # Increment patch version.
    pnpm increment && \
    # Build both channels.
    pnpm beta chrome-mv3 --zip && \
    pnpm release chrome-mv3 --zip && \
    # Skip-review checks (download latest from CWS + compare).
    if [ "${SKIP_REVIEW}" = "true" ]; then \
      if [ "${BETA_CHANNEL_AVAILABLE}" = "true" ]; then \
        pnpm tsx tools/skip-review/download-latest-extension-mv3 beta && \
        pnpm tsx tools/skip-review/check-changes-for-cws ./tmp/extension-beta-latest ./build/beta/chrome-mv3; \
      fi; \
      if [ "${RELEASE_CHANNEL_AVAILABLE}" = "true" ]; then \
        pnpm tsx tools/skip-review/download-latest-extension-mv3 release && \
        pnpm tsx tools/skip-review/check-changes-for-cws ./tmp/extension-release-latest ./build/release/chrome-mv3; \
      fi; \
    fi && \
    # Collect build artifacts.
    mkdir -p /out/artifacts && \
    mv build/beta/chrome-mv3.zip /out/artifacts/chrome-mv3-beta.zip && \
    mv build/release/chrome-mv3.zip /out/artifacts/chrome-mv3-release.zip && \
    cp build/release/build.txt /out/artifacts/ && \
    # Collect modified source files for git commit.
    # Uses marker file to find files changed by pnpm resources:mv3 and pnpm increment.
    # Build exclusion args from gitignore-excludes.txt (generated on host by generate-find-excludes.sh)
    # to skip build artifacts, node_modules, etc.
    mkdir -p /out/modified && \
    . ./bamboo-specs/scripts/parse-gitignore.sh gitignore-excludes.txt && \
    find . -newer /tmp/.pre-update-marker -type f "${GITIGNORE_EXCLUDE_ARGS[@]}" \
      | sed 's|^\./||' | while IFS= read -r f; do \
        mkdir -p "/out/modified/$(dirname "$f")"; \
        cp "$f" "/out/modified/$f"; \
      done

FROM scratch AS auto-build-output
COPY --from=auto-build /out/ /
