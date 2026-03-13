# AI Agent Guidelines for AdGuard Browser Extension

This document provides guidance for AI coding assistants and human contributors
working on the AdGuard Browser Extension codebase.

## Project Overview

AdGuard Browser Extension is a fast, lightweight, open-source ad-blocking
browser extension with advanced privacy protection features. It blocks all types
of ads, trackers, and prevents websites from building shadow profiles. The
extension ships in two manifest versions (MV2 and MV3) across Chrome, Firefox,
Edge, and Opera. Licensed under GPL-3.0.

## Technical Context

- **Language/Version**: TypeScript 5.6, Node.js v22, pnpm v10
- **Primary Dependencies**: React 17, MobX 6, XState 5, `@adguard/tsurlfilter`,
  `@adguard/tswebextension`, `@adguard/scriptlets`, Zod 3
- **Bundler**: Rspack (via `@rspack/core`)
- **Storage**: `chrome.storage.local`, IndexedDB (`idb`)
- **Testing**: Vitest 4 (unit), Playwright 1.53 (integration)
- **Target Platform**: Browser extension (Chromium MV2/MV3, Firefox, Edge, Opera)
- **Project Type**: Single-package repository (not a monorepo)
- **Constraints**: MV3 bundle must stay under 30 MB; Firefox `.js` files under
  4 MB

## Project Structure

```text
├── Extension/                  # Extension source and static assets
│   ├── _locales/               # i18n translation files (50+ languages)
│   ├── assets/                 # CSS, fonts, icons
│   ├── filters/                # Pre-built filter rulesets per browser
│   ├── pages/                  # HTML entry points for extension pages
│   └── src/
│       ├── background/         # Background service/page (API, services, storages, schema)
│       ├── common/             # Shared utilities, constants, logger, messages
│       ├── content-script/     # Content scripts injected into web pages
│       └── pages/              # UI pages (options, popup, filtering-log, etc.)
├── tests/
│   ├── helpers/                # Test fixtures and mocks
│   └── src/                    # Unit tests mirroring Extension/src structure
├── tools/
│   ├── bundle/                 # Rspack configs per browser target
│   ├── bundle-size/            # Bundle size monitoring system
│   ├── browser-test/           # Integration test runner (Playwright)
│   ├── locales/                # Locale management scripts
│   ├── resources/              # Filter download and processing scripts
│   └── skip-review/            # CWS skip-review tooling
├── bamboo-specs/               # CI/CD pipeline definitions (Bamboo)
│   ├── jobs/                   # Job definitions for auto-builds
│   └── scripts/                # Shared CI shell scripts
├── specs/                      # Feature specifications
├── package.json                # Dependencies and scripts
├── tsconfig.base.json          # Shared TS compiler options
├── tsconfig.mv2.json           # MV2 project (excludes *-mv3.ts)
├── tsconfig.mv3.json           # MV3 project (excludes *-mv2.ts)
├── vitest.config.ts            # Vitest config (MV2 + MV3 projects)
├── .eslintrc.cjs               # Root ESLint config
├── Dockerfile                  # Multi-stage CI builds
├── AGENTS.md
├── CHANGELOG.md
├── DEVELOPMENT.md
└── README.md
```

### Manifest Versions

- **MV2**: Manifest V2 — Chrome, Firefox, Edge, Opera
- **MV3**: Manifest V3 — Chrome MV3, Opera MV3

Files are suffixed with `-mv2` or `-mv3` to indicate version-specific
implementations. Common code must **not** import directly from these files
(enforced by ESLint `no-restricted-imports`). Instead, use TypeScript path
aliases defined in `tsconfig.mv2.json` / `tsconfig.mv3.json`.

## Build And Test Commands

### Setup

```bash
pnpm install                   # Install dependencies
pnpm resources                 # Download filters / public suffix list
pnpm resources:mv3             # Download MV3-specific resources + DNR rulesets
```

### Build

```bash
pnpm dev                       # Dev build for all browsers
pnpm dev <browser>             # Dev build for one browser
pnpm dev <browser> --watch     # Dev build with file watching
pnpm beta                      # Beta build (all browsers)
pnpm beta <browser>            # Beta build for one browser
pnpm release                   # Release build (all browsers)
pnpm release <browser>         # Release build for one browser
```

Supported `<browser>` values: `chrome`, `chrome-mv3`, `edge`, `opera`,
`opera-mv3`, `firefox-amo`, `firefox-standalone`.

### Test

```bash
pnpm test                      # Run all unit tests (MV2 + MV3)
pnpm test:mv2                  # Run MV2 unit tests only
pnpm test:mv3                  # Run MV3 unit tests only
pnpm test <pattern>            # Run tests matching pattern
pnpm test:integration <target> # Integration tests (dev/beta/release)
```

### Lint

```bash
pnpm lint                      # ESLint + TypeScript type checking
pnpm lint:code                 # ESLint only
pnpm lint:types                # TypeScript type checking (MV2 + MV3)
pnpm lint:types:mv2            # TypeScript for MV2
pnpm lint:types:mv3            # TypeScript for MV3
```

### Other

```bash
pnpm check-bundle-size <env> [browser]   # Check bundle sizes
pnpm update-bundle-size <env> [browser]  # Update reference sizes
pnpm locales download                    # Download translations
pnpm locales validate                    # Validate translations
pnpm increment                           # Increment build version
```

## Contribution Instructions

### Before Submitting Changes

1. Run `pnpm lint` — all checks must pass
2. Run `pnpm test` — all tests must pass
3. Verify no direct imports from `-mv2`/`-mv3` files in common code
4. Ensure proper error handling with UI revert on failure
5. Confirm JSDoc comments follow project style (see Code Guidelines)
6. Use `logger` instead of `console.*`
7. Verify MobX decorators are correct (`@action` vs `@override`)
8. Check memory cleanup (dispose timers, listeners, observers)
9. Confirm TypeScript types are correct (no `any` without justification)

### Copyright Header

Every source file must have the GPL-3.0 copyright header. The ESLint
`notice/notice` rule enforces this automatically and will auto-fix missing or
incorrect headers.

### Commit Conventions

- Keep commits focused and atomic
- Reference issue IDs (e.g., `AG-12345`) when applicable

## Code Guidelines

### Architecture

#### Version-Specific Code Pattern

Files are split by manifest version using the `-mv2`/`-mv3` suffix convention.
Common code imports via TypeScript path aliases that resolve to the correct
version at build time:

**MV2 file** (`Options-mv2.tsx`):
```typescript
const createMessageHandlerWithPause = (...) => { /* MV2-specific logic */ };

export {
    createMessageHandlerWithPause as createMessageHandler,
};
```

**MV3 file** (`Options-mv3.tsx`):
```typescript
export const createMessageHandler = (...) => { /* MV3-specific logic */ };
```

**Common file** (`Options.tsx`):
```typescript
import { createMessageHandler } from 'options'; // Resolves to correct version
```

#### TypeScript Configuration

- `tsconfig.mv2.json` — MV2 type checking (excludes `**/*-mv3.ts`)
- `tsconfig.mv3.json` — MV3 type checking (excludes `**/*-mv2.ts`)
- Both extend `tsconfig.base.json` and use `composite` project references
- `tsconfig.eslint.json` — includes all files for linting

#### Error Handling

- Always handle errors in async operations
- Revert optimistic UI updates on failure
- Log errors with context using `logger.error()`

#### Optimistic UI Updates (MV2 only)

Pattern used in MobX stores:
```typescript
async updateSetting(id: number, enabled: boolean): Promise<void> {
    // 1. Register pending change (if using EventPauseController)
    eventPauseController.registerPendingChange(type, id, enabled);

    // 2. Update UI optimistically
    this.setStateUI(id, enabled);

    try {
        // 3. Call backend
        await this.updateCore(id, enabled);

        // 4. Confirm success
        eventPauseController.confirmChange(type, id, enabled);
    } catch (error) {
        // 5. Revert UI on error
        this.setStateUI(id, !enabled);
        eventPauseController.cancelChange(type, id);
        throw error;
    }
}
```

#### Memory Management

- Always dispose of timers, listeners, and observers in cleanup methods
- Use `dispose()` or cleanup functions in React `useEffect` hooks

### Code Quality

#### Import Rules

- **DO NOT** import directly from `-mv2` or `-mv3` files in common code
- Use TypeScript path aliases defined in `tsconfig.mv2.json` / `tsconfig.mv3.json`
- Exception: Test files (`*.test.ts`) and MV2/MV3-specific files can import
  directly

#### JSDoc Style

Use standard JSDoc format **without** `" - "` separator in `@param` and
`@returns` tags. Tags must be separated by blank lines:

```typescript
/**
 * Description of the function.
 *
 * @param paramName Description of parameter
 *
 * @returns Description of return value
 */
```

The `background/` directory has **stricter** JSDoc rules (enforced via
`Extension/src/background/.eslintrc.cjs`): all classes, class properties,
functions, and methods require JSDoc with descriptions, `@param`, and `@returns`.
Descriptions must be complete sentences.

#### Logging

- Use `logger` from `Extension/src/common/logger` instead of `console.*`
- The ESLint rule `no-console: error` enforces this
- Format: `[ext.ClassName.methodName]: message`
- Example: `logger.warn('[ext.EventPauseController.forceResume]: Force resuming with pending changes:', data);`
- The custom ESLint plugin `@adguard/logger-context` enforces context tags in
  logger calls

#### MobX Decorators

- Use `@action` for methods that modify observable state
- Use `@override` (not `@action`) when overriding parent class methods already
  decorated with `@action`
- Never use both `@action` and `@override` on the same method

#### Style

- 4-space indentation
- 120-character line length limit
- `1tbs` brace style (no single-line blocks)
- Airbnb ESLint config as base (`eslint-config-airbnb-typescript`)
- Wildcard re-exports (`export *`) are forbidden
- Consistent type imports: `import { type Foo } from '...'` (inline style)

### Testing

#### Organization

- Test files mirror the `Extension/src/` structure under `tests/src/`
- Version-specific tests use suffix `-mv2.test.ts` or `-mv3.test.ts`
- Use `describe.skipIf(__IS_MV3__)` or `describe.skipIf(__IS_MV2__)` to skip
  tests for a specific manifest version
- Mock external dependencies (messenger, logger, etc.)

#### Configuration

- `vitest.config.ts` defines two projects: `mv2` and `mv3`
- Global variable `__IS_MV3__` is available in tests for conditional logic
- Test environment: jsdom with `fake-indexeddb`

### Other

#### CI/CD (Bamboo)

- Build plans: `bamboo-specs/*.yaml`
- Job definitions: `bamboo-specs/jobs/auto-builds/`
- Shared scripts: `bamboo-specs/scripts/`
- All build jobs run inside Docker via `docker build --target <stage>`
- `Dockerfile` defines multi-stage builds (lint, test, build, etc.)

**Key Build Plans:**
- `auto-build.yaml` — Scheduled auto-build (every 12h) on stable branch for MV3
- `build-beta.yaml` — Beta builds (chrome, chrome-mv3, edge)
- `build-release.yaml` — Release builds (all browsers)
- `build-firefox-beta.yaml` — Firefox beta build + AMO signing
- `tests.yaml` — Lint + unit/integration tests for PRs

**Docker Build Conventions:**
- Each CI job maps to a Dockerfile stage (e.g., `--target lint-output`)
- Output stages use `FROM scratch` + `COPY --from=<stage>` pattern
- Build artifacts are extracted via `--output type=local,dest=<dir>`
- `.git` is excluded from Docker context (`.dockerignore`)

**Script Conventions:**
- Every script must start with `set -ex` and include the standard comment block
  explaining `-e` and `-x`
- Use `exec 2>&1` after `set -ex` to fix mixed stdout/stderr logs in Bamboo
- Scripts should not be sourced for `set` options (they don't propagate)

#### Bundle Size Monitoring

- Tracked in `.bundle-sizes.json` with configurable thresholds (default: 10%)
- MV3 must stay under 30 MB; Firefox `.js` files under 4 MB
- Duplicate package versions detected via `pnpm`
- Run `pnpm check-bundle-size <env> [browser]` to verify

## Resources

- [DEVELOPMENT.md](./DEVELOPMENT.md) — Development setup, build instructions,
  and detailed workflows
- [README.md](./README.md) — Project overview, installation, and contribution
  info
- [CHANGELOG.md](./CHANGELOG.md) — Version history
