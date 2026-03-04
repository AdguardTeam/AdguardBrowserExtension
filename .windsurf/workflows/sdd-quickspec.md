---
description: Create a lightweight analysis for bug fixes and small tasks (v1.5.0)
---

# Quick Specification

This workflow produces a lightweight analysis document for bug fixes and small
tasks that don't require full feature specifications. It combines problem
analysis, codebase research, and solution design into a single output file.

## Input

The workflow requires a problem description as input (the `$ARGUMENTS` provided
by the user). Examples:

- Bug fix: "fix the null pointer exception in UserService.getUser()"
- Refactoring: "rename processData function to transformUserInput"
- Configuration: "add Redis connection timeout configuration"

If no description is provided, stop and report:
**ERROR: No problem description provided.**

## Steps

### Phase 1: Problem Analysis

1. **Extract the problem statement**
    - Identify what needs to be fixed or changed
    - Determine the type of task (bug fix, refactoring, configuration, etc.)
    - Note any specific files, functions, or components mentioned

2. **Read project context**
    - Read `AGENTS.md` if it exists (coding standards and patterns)
    - Read `DEVELOPMENT.md` if it exists (development setup)
    - Understand the project structure and conventions

### Phase 2: Research

1. **Search the codebase**
    - Find the code related to the problem
    - Identify where the issue manifests or where changes are needed
    - Look for similar patterns or related functionality

2. **Analyze the findings**
    - For bugs: identify the root cause
    - For refactoring: find all usages and dependencies
    - For configuration: understand existing patterns

3. **List affected files**
    - Identify all files that need modification
    - Note any test files that need updates
    - Flag any configuration or documentation changes

### Phase 3: Solution Design

1. **Propose the solution**
    - Describe the fix or change approach
    - Keep it minimal and focused
    - Note any alternative approaches considered

2. **Define verification steps**
    - How to verify the fix works
    - What tests to run
    - Any manual verification needed

### Phase 4: Complexity Check

1. **Evaluate task complexity**
    - Check for indicators that suggest full SDD is needed:
        - Multiple unrelated components affected
        - New entities or data models required
        - API contract changes
        - New user-facing features
        - Cross-cutting concerns (auth, logging, etc.)

2. **Recommend workflow**
    - If complexity indicators found: recommend `/sdd-spec` instead
    - If task is straightforward: proceed with quick spec

### Phase 5: Write Quick Spec

1. **Create the quick spec file**
    - Write to `specs/.current/quick.md`
    - Create the `specs/.current/` directory if it doesn't exist
    - Use the template structure below

2. **Review the output**
    - Verify problem is clearly stated
    - Confirm affected files are identified
    - Check that solution is actionable

## Quick Spec Template

```markdown
# Quick Spec: [BRIEF TITLE]

**Created**: [DATE]
**Status**: Draft
**Type**: [Bug Fix | Refactoring | Configuration | Documentation | Other]
**Input**: User description: "$ARGUMENTS"

## Problem

[Clear description of what needs to be fixed or changed]

## Research Findings

[Summary of codebase analysis]

### Root Cause

[For bugs: explain why the issue occurs]
[For other tasks: explain current state and why change is needed]

### Affected Files

- `path/to/file1.ext` - [what needs to change]
- `path/to/file2.ext` - [what needs to change]

## Solution

[Describe the proposed fix or change]

### Approach

[Step-by-step approach to implement the solution]

### Alternatives Considered

[Optional: other approaches and why they were not chosen]

## Verification

- [ ] [How to verify the fix works]
- [ ] [Tests to run]
- [ ] [Any manual checks needed]

## Notes

[Optional: any additional context, risks, or considerations]
```

## Guidelines

- **Stay focused**: Quick specs are for small, well-defined tasks
- **Research first**: Understand the problem before proposing solutions
- **Minimal scope**: If the task grows, recommend full SDD instead
- **Be specific**: List exact files and changes needed
- **Verify feasibility**: Ensure the solution is implementable
- **Document assumptions**: Note any assumptions made during analysis
