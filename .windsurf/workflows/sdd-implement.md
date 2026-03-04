---
description: Implement a feature according to its specification and plan (v1.5.0)
---

# Implement Feature

This workflow implements a feature by executing the tasks defined in the
implementation plan (`/specs/.current/plan.md`) according to the feature
specification (`/specs/.current/spec.md`).

## Input

The workflow accepts optional user input (`$ARGUMENTS`) to control implementation
scope. Examples:

- Task selection: "Task 1.1 only" or "Phase 1"
- Resume point: "Continue from Task 2.3"
- Skip tasks: "Skip tests for now"

If no arguments are provided, the workflow implements all tasks in order.

## Prerequisites

Check for the existence of both required files:

1. `/specs/.current/spec.md` - The feature specification
2. `/specs/.current/plan.md` - The implementation plan

If either file is missing:

**ERROR: Required files not found. Ensure both `/specs/.current/spec.md` and
`/specs/.current/plan.md` exist. Run `/sdd-spec` and `/sdd-plan` first.**

## Steps

### Phase 1: Load Context

1. **Read the implementation plan**
   - Read `/specs/.current/plan.md`
   - Extract all tasks with their:
     - Description and complexity
     - Prerequisites
     - Verification criteria
   - Note the task execution order

2. **Read the feature specification**
   - Read `/specs/.current/spec.md`
   - Extract functional requirements for reference
   - Note acceptance scenarios for verification

3. **Read project guidelines**
   - Read `AGENTS.md` if it exists (coding standards and patterns)
   - Read `DEVELOPMENT.md` if it exists (development setup)
   - These inform implementation style and conventions

4. **Load contracts** (if applicable)
   - Check `/specs/.current/contracts/` directory
   - Load API schemas to guide implementation

### Phase 2: Determine Scope

1. **Parse user input** (if provided)
   - Identify which tasks to implement
   - Note any tasks to skip
   - Determine starting point

2. **Build task queue**
   - If no input: queue all tasks in plan order
   - If input specifies tasks: queue only those tasks
   - Verify prerequisites are satisfied for queued tasks

3. **Report scope**
   - List tasks that will be implemented
   - Note any skipped tasks and reasons
   - Confirm with user if scope is ambiguous

### Phase 3: Execute Tasks

For each task in the queue:

1. **Announce task**
   - Display task ID, description, and complexity
   - List prerequisites and their status

2. **Research before coding**
   - Search codebase for related patterns
   - Find similar implementations to follow
   - Identify files that need modification

3. **Implement the task**
   - Follow existing code patterns and conventions
   - Adhere to project guidelines from `AGENTS.md`
   - Create new files only when necessary
   - Prefer minimal, focused changes

4. **Verify the task**
   - Execute the verification criteria from the plan
   - Run relevant tests if they exist
   - Check that acceptance scenarios pass

5. **Report task status**
   - **DONE**: Task completed and verified
   - **BLOCKED**: Cannot proceed (explain why)
   - **NEEDS INPUT**: Requires user decision

6. **Update plan progress**
   - Mark completed tasks in the plan file
   - Add implementation notes if helpful

### Phase 4: Integration Check

After completing all queued tasks:

1. **Run project verification**
   - Execute build command (if applicable)
   - Run linter and formatter
   - Execute test suite

2. **Check requirement coverage**
   - For each functional requirement in the spec
   - Verify implementation addresses it
   - Note any gaps

3. **Report completion status**
   - List completed tasks
   - List any remaining tasks
   - Note issues encountered

4. **Update spec status**
   - If all tasks completed successfully:
     - Change status from "Draft" to "Implemented" in `spec.md`
     - Add implementation notes if helpful

## Task Execution Guidelines

### Code Quality

- **Follow existing patterns**: Match the style of surrounding code
- **Minimal changes**: Implement only what the task requires
- **No premature optimization**: Focus on correctness first
- **Document decisions**: Add comments for non-obvious choices

### Testing

- **Write tests alongside code**: Don't defer testing
- **Cover acceptance scenarios**: Each scenario should have a test
- **Test edge cases**: Include boundary conditions from the spec

### Error Handling

- **Task blocked**: Stop and report the blocker clearly
- **Ambiguous requirement**: Make a reasonable choice and document it
- **Test failure**: Fix the issue before proceeding
- **Build failure**: Resolve before moving to next task

### Progress Tracking

- **One task at a time**: Complete and verify before moving on
- **Update plan file**: Mark tasks as complete with `[x]`
- **Note deviations**: Document any changes from the plan

## Output

After implementation:

1. **Summary of completed work**
   - Tasks completed
   - Files created/modified
   - Tests added

2. **Remaining work** (if any)
   - Tasks not yet implemented
   - Known issues or blockers

3. **Next steps**
   - Suggest running `/sdd-validate` to verify completeness
   - Note any manual verification needed

## Guidelines

- **Incremental progress**: Complete tasks one at a time
- **Verify continuously**: Don't accumulate unverified changes
- **Respect prerequisites**: Don't skip task dependencies
- **Stay in scope**: Implement what the plan specifies, no more
- **Document blockers**: If stuck, explain clearly and stop
- **Follow project conventions**: Adhere to `AGENTS.md` guidelines
