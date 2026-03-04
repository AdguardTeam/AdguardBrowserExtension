---
description: Implement a fix or small change from a quick specification (v1.5.0)
---

# Quick Implementation

This workflow implements a fix or small change according to the analysis in
the quick specification (`/specs/.current/quick.md`).

## Prerequisites

Check for the existence of the required file:

- `/specs/.current/quick.md` - The quick specification

If the file is missing:

**ERROR: Quick spec not found. Run `/sdd-quickspec` first to analyze the problem.**

## Steps

### Phase 1: Load Context

1. **Read the quick spec**
    - Read `/specs/.current/quick.md`
    - Extract:
        - Problem statement
        - Root cause analysis
        - Affected files list
        - Proposed solution
        - Verification steps

2. **Read project guidelines**
    - Read `AGENTS.md` if it exists (coding standards and patterns)
    - Read `DEVELOPMENT.md` if it exists (development setup)

3. **Verify affected files exist**
    - Check that all files listed in the quick spec exist
    - If files are missing, report and stop

### Phase 2: Implement

1. **Apply the fix or change**
    - Follow the solution approach from the quick spec
    - Modify files in the order listed
    - Follow existing code patterns and conventions
    - Keep changes minimal and focused

2. **Update tests** (if applicable)
    - Add or update tests to cover the change
    - Ensure tests verify the fix works

3. **Update documentation** (if applicable)
    - Update any affected documentation
    - Add comments for non-obvious changes

### Phase 3: Verify

1. **Run verification steps**
    - Execute each verification item from the quick spec
    - Run relevant tests
    - Perform any manual checks listed

2. **Run project checks**
    - Execute linter and formatter
    - Run the test suite
    - Check for build errors

3. **Confirm fix**
    - Verify the original problem is resolved
    - Check for regressions

### Phase 4: Cleanup

1. **Update quick spec status**
    - Change status from "Draft" to "Implemented" in `quick.md`
    - Add implementation notes if helpful

2. **Update CHANGELOG** (if applicable)
    - Add entry to the Unreleased section
    - Use appropriate subsection (Fixed, Changed, etc.)

3. **Final lint check**
    - Run `make lint` or equivalent
    - Fix any issues

## Output

After implementation:

1. **Summary**
    - What was fixed or changed
    - Files modified
    - Tests added or updated

2. **Verification results**
    - Which checks passed
    - Any issues encountered

3. **Next steps** (if any)
    - Additional manual verification needed
    - Related issues to address

## Guidelines

- **Follow the spec**: Implement what the quick spec describes
- **Minimal changes**: Don't expand scope beyond the spec
- **Verify before completing**: Ensure the fix actually works
- **Update tests**: Cover the change with tests when possible
- **Document changes**: Update CHANGELOG for user-visible changes
- **Stay focused**: If new issues are discovered, create separate tasks
