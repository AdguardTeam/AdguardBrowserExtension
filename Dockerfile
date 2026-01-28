# ENV NODE_VERSION=22.17.0
FROM mcr.microsoft.com/playwright:v1.53.2-noble AS base
SHELL ["/bin/bash", "-lc"]

# Install dependencies
RUN apt-get update \
    && apt-get install -y git curl \
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
    if [ -d tests-reports ]; then cp -R tests-reports/. /out/tests-reports/; fi; \
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
# Runs integration tests (requires chrome-mv3-dev.zip artifact)
# ============================================================================
FROM linked-deps AS integration-tests

COPY artifacts/chrome-mv3-dev.zip /extension/chrome-mv3-dev.zip

ARG TEST_RUN_ID

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Bust build cache so test/lint/build stages always rerun.
    echo "${TEST_RUN_ID}" > /tmp/.test-run-id && \
    mkdir -p build/dev && \
    # Move artifact to build directory, because integration tests expect it there.
    mv /extension/chrome-mv3-dev.zip /extension/build/dev/chrome-mv3.zip && \
    # For correct link playwright browsers.
    pnpm exec playwright install && \
    mkdir -p /out/tests-reports && \
    set +e; \
    # Run integration tests.
    pnpm test:integration dev; \
    EXIT_CODE=$?; \
    if [ -d tests-reports ]; then cp -R tests-reports/. /out/tests-reports/; fi; \
    # Rename test report to match JUnit parser pattern (mirrors integration-tests.sh).
    if [ -f /out/tests-reports/integration-tests.xml ]; then \
        mv /out/tests-reports/integration-tests.xml /out/tests-reports/integration-tests-dev.xml; \
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
# Checks bundle sizes for beta build
# ============================================================================
FROM linked-deps AS bundle-size-check

RUN --mount=type=cache,target=/pnpm-store,id=browser-extension-pnpm \
    # Run beta build with zip files (cached until source changes).
    pnpm beta --zip && \
    # Check bundle sizes.
    pnpm check-bundle-size beta && \
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
