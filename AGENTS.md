# AI Agent Guidelines for AdGuard Browser Extension

This document provides guidance for AI coding assistants working on the AdGuard Browser Extension codebase.

## Project Structure

### Manifest Versions
- **MV2**: Manifest V2 implementation (Chrome, Firefox, Edge, Opera)
- **MV3**: Manifest V3 implementation (Chrome MV3, Edge MV3)

Files are suffixed with `-mv2` or `-mv3` to indicate version-specific implementations.

### Key Directories
- `Extension/src/background/` - Background service/page logic
- `Extension/src/pages/` - UI pages (options, popup, etc.)
- `Extension/src/common/` - Shared utilities and constants
- `tests/` - Test files (Vitest)

## Code Style & Conventions

### Import Rules
- **DO NOT** import directly from `-mv2` or `-mv3` files in common code
- Use TypeScript path aliases defined in `tsconfig.mv2.json` and `tsconfig.mv3.json`
- Exception: Test files (`*.test.ts`) and MV2/MV3-specific files can import directly

### JSDoc Style
- Use standard JSDoc format without " - " separator in `@param` and `@returns` tags
- Example:
  ```typescript
  /**
   * Description of the function.
   *
   * @param paramName Description of parameter
   *
   * @returns Description of return value
   */
  ```

### Logging
- Use `logger` from `Extension/src/common/logger` instead of `console.*`
- Format: `[ext.ClassName.methodName]: message`
- Example: `logger.warn('[ext.EventPauseController.forceResume]: Force resuming with pending changes:', data);`

### MobX Decorators
- Use `@action` for methods that modify observable state
- Use `@override` (not `@action`) when overriding parent class methods that are already decorated with `@action`
- Never use both `@action` and `@override` on the same method

## Testing

### Test Organization
- Test files use suffix `-mv2.test.ts` or `-mv3.test.ts` for version-specific tests
- Use `describe.skipIf(__IS_MV3__)` or `describe.skipIf(__IS_MV2__)` to skip tests for specific versions
- Mock external dependencies (messenger, logger, etc.)

### Running Tests
```bash
pnpm test                    # Run all tests
pnpm test <pattern>          # Run tests matching pattern
```

## Linting & Type Checking

### Commands
```bash
pnpm lint                    # Run all linters
pnpm lint:code               # ESLint only
pnpm lint:types              # TypeScript type checking
pnpm lint:types:mv2          # TypeScript for MV2
pnpm lint:types:mv3          # TypeScript for MV3
```

### ESLint Configuration
- `.eslintrc.cjs` contains project-specific rules
- `no-restricted-imports` prevents direct imports from MV2/MV3 files
- Override patterns: `**/*-mv2?(.test).{ts,tsx,js,jsx}` and `**/*-mv3?(.test).{ts,tsx,js,jsx}`

## Common Patterns

### Version-Specific Exports
When creating barrel exports that work for both MV2 and MV3:

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

### Error Handling
- Always handle errors in async operations
- Revert optimistic UI updates on failure
- Log errors with context using `logger.error()`

### Optimistic UI Updates (only for MV2)
Pattern used in stores:
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

## Build System

### Build Commands
```bash
pnpm dev <browser>           # Development build with watch
pnpm build                   # Production build for all browsers
pnpm build:beta              # Beta build
```

### Supported Browsers
- `chrome` (MV2)
- `chrome-mv3` (MV3)
- `firefox`
- `edge` (MV2)
- `edge-mv3` (MV3)
- `opera`

## Important Notes

### Memory Management
- Always dispose of timers, listeners, and observers in cleanup methods
- Use `dispose()` or cleanup functions in React `useEffect` hooks

### TypeScript Configuration
- `tsconfig.mv2.json` - MV2 type checking (excludes `**/*-mv3.ts`)
- `tsconfig.mv3.json` - MV3 type checking (excludes `**/*-mv2.ts`)
- Both extend `tsconfig.base.json`

### Vitest Configuration
- `vitest.config.ts` defines separate projects for MV2 and MV3
- Global variable `__IS_MV3__` available in tests for conditional logic

## Review Checklist

Before submitting changes:
- [ ] Run `pnpm lint` - all checks pass
- [ ] Run `pnpm test` - all tests pass
- [ ] No direct imports from `-mv2`/`-mv3` files in common code
- [ ] Proper error handling with UI revert on failure
- [ ] JSDoc comments follow project style (no " - " separator)
- [ ] Use `logger` instead of `console.*`
- [ ] MobX decorators used correctly (`@action` vs `@override`)
- [ ] Memory cleanup implemented (dispose timers, listeners)
- [ ] TypeScript types are correct (no `any` without justification)

## CI/CD (Bamboo)

### Pipeline Structure
- Build plans are defined in `bamboo-specs/*.yaml`
- Job definitions for auto-builds live in `bamboo-specs/jobs/auto-builds/`
- Shared scripts live in `bamboo-specs/scripts/`
- All build jobs run inside Docker via `docker build --target <stage>`
- The `Dockerfile` defines multi-stage builds for each job (lint, test, build, etc.)

### Key Build Plans
- `auto-build.yaml` - Scheduled auto-build (every 12h) on stable branch for MV3
- `build-beta.yaml` - Beta builds (chrome, chrome-mv3, edge)
- `build-release.yaml` - Release builds (all browsers)
- `build-firefox-beta.yaml` - Firefox beta build + AMO signing
- `tests.yaml` - Lint + unit/integration tests for PRs

### Docker Build Conventions
- Each CI job maps to a Dockerfile stage (e.g., `--target lint-output`)
- Output stages use `FROM scratch` + `COPY --from=<stage>` pattern
- Build artifacts are extracted via `--output type=local,dest=<dir>`
- `.git` is excluded from Docker context (`.dockerignore`); use `generate-find-excludes.sh` on host for gitignore-aware file operations inside Docker

### Script Conventions
- Every script must start with `set -ex` and include the standard comment block explaining `-e` and `-x`
- Use `exec 2>&1` after `set -ex` to fix mixed stdout/stderr logs in Bamboo
- Scripts should not be sourced for `set` options (they don't propagate)

## Resources

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup and workflow
- [README.md](./README.md) - Project overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history
