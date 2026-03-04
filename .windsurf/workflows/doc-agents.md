---
description: Actualize AGENTS.md to provide LLM agents with project context and contribution rules (v1.5.0)
---

# Actualize AGENTS.md

This workflow updates `AGENTS.md` to comply with the AGENTS.md template: a
document that provides LLM agents (and human contributors) with project context,
structure, build commands, contribution rules, and code guidelines.

## Prerequisites

Before starting, verify the repository contains these resources:

- Source code with identifiable structure
- Build/test configuration files (e.g., `package.json`, `pyproject.toml`,
  `Makefile`, `go.mod`)
- Existing `AGENTS.md` (will be updated) or none (will be created)

If the project has no source code yet, ask the user whether to create a
skeleton `AGENTS.md` or wait until code exists.

## Steps

### Phase 1: Information Gathering

1. **Read the current AGENTS.md (if exists)**
   - Review existing content
   - Note which sections are filled vs placeholder
   - Identify outdated or incorrect information

2. **Gather project information from the codebase**
   - Examine build/dependency files (`package.json`, `pyproject.toml`,
     `Cargo.toml`, `go.mod`, `Makefile`, etc.) for:
     - Language and version
     - Primary dependencies
     - Build, test, and lint commands
   - Scan the directory structure to understand project layout
   - Read `README.md` for project purpose (if exists)
   - Check for database/storage configuration files
   - Identify testing framework from test files or config
   - Look for linter/formatter configs (`.eslintrc`, `ruff.toml`, etc.)

3. **Identify information gaps**
   After gathering information, determine if you can answer these questions:
   - What does the project do? (for Project Overview)
   - What language/framework is used?
   - What are the main directories and their purposes?
   - What commands build, test, and lint the project?
   - What storage/database is used (if any)?
   - What platform does it target?
   - What are the project's architectural patterns?

   If critical questions cannot be answered from the codebase,
   **ask the user for clarification** before proceeding.

### Phase 2: Content Planning

1. **Plan updates for each section**
   Map gathered information to AGENTS.md sections:
   - **Project Overview**: Brief description from README or code analysis
   - **Technical Context**: Language, dependencies, storage, testing, platform
   - **Project Structure**: Directory tree with descriptions
   - **Build And Test Commands**: Extracted from build config files
   - **Contribution Instructions**: Adapt template rules to project's tooling
   - **Code Guidelines**: Infer from existing code patterns or ask user

2. **Identify project-specific rules**
   Note any patterns that should become contribution rules:
   - Required linting/formatting commands
   - Test requirements
   - Documentation standards
   - Commit/PR conventions

### Phase 3: Writing

1. **Update Project Overview**
   - Write a concise description of what the project does
   - Remove placeholder comments, keep only actual content

2. **Update Technical Context**
   Fill in all applicable fields:
   - **Language/Version**: Exact version from config files
   - **Primary Dependencies**: Key frameworks/libraries
   - **Storage**: Database or storage solution
   - **Testing**: Testing framework used
   - **Target Platform**: Where the code runs
   - **Project Type**: single/web/mobile/monorepo
   - **Performance Goals**: If documented, otherwise ask or mark N/A
   - **Constraints**: Known limitations
   - **Scale/Scope**: Target audience size

3. **Update Project Structure**
   - Generate accurate directory tree
   - Include only important directories (not every file)
   - Add brief descriptions for each directory
   - Use consistent formatting

4. **Update Build And Test Commands**
   List all relevant commands:
   - Build command
   - Test command (unit, integration, e2e if applicable)
   - Lint command
   - Format command
   - Run/start command
   - Any other common development commands

5. **Update Contribution Instructions**
   - Replace placeholder commands with actual project commands
   - Keep rules that apply, remove those that don't
   - Add project-specific rules discovered during analysis

6. **Update Code Guidelines**
   For each subsection (Architecture, Code Quality, Testing, Other):
   - Fill in patterns observed in the codebase
   - Include rationale where clear
   - Remove placeholder comments
   - Ask user for guidance on unclear conventions

### Phase 4: Validation

1. **Review against template requirements**
   Verify the AGENTS.md:
   - [ ] Has a clear Project Overview (no placeholder)
   - [ ] Technical Context fields are filled or explicitly marked N/A
   - [ ] Project Structure matches actual codebase
   - [ ] Build And Test Commands are accurate and runnable
   - [ ] Contribution Instructions reference actual project commands
   - [ ] Code Guidelines reflect actual project patterns
   - [ ] No placeholder comments remain in filled sections
   - [ ] All commands are correct (test by running if possible)

2. **Verify commands work**
   If possible, run the documented commands to verify they work:
   - Build command
   - Lint command
   - Test command (at least check it starts)

3. **Format and finalize**
   - Check markdown formatting
   - Ensure consistent heading levels
   - Verify code blocks use correct language tags

## Guidelines

- **Accuracy over completeness**: Only document what you can verify; mark
  unknowns as TBD or ask the user
- **Keep it maintainable**: Don't over-document; focus on what agents need
- **Match project reality**: Commands and structure must reflect actual state
- **Preserve valid content**: Don't discard existing content that's still accurate
- **Ask when uncertain**: If conventions or architecture are unclear, ask the user
- **Remove placeholders**: Replace template comments with actual content or remove
  sections that don't apply
