---
description: Validate that a feature specification is fully implemented according to its plan (v1.5.0)
---

# Validate Specification Implementation

This workflow verifies that a feature specification has been fully implemented
according to its implementation plan. It supports both full specifications
(spec.md + plan.md) and quick specifications (quick.md).

## Prerequisites

Check for specification files in `/specs/.current/`:

1. **Full spec mode**: Both `/specs/.current/spec.md` AND `/specs/.current/plan.md` exist
2. **Quick spec mode**: `/specs/.current/quick.md` exists

Determine validation mode:

- If both full spec files exist → use **Full Validation** (Phases 1-7)
- If only `quick.md` exists → use **Quick Validation** (Phase Q)
- If both exist → prefer **Full Validation** (quick.md is likely outdated)
- If neither exists → show error below

**ERROR (if no specs found)**: Required files not found. Run `/sdd-spec` and
`/sdd-plan` for full specifications, or `/sdd-quickspec` for quick fixes.

## Steps

### Phase 1: Load Documentation

1. **Read the feature specification**
   - Read `/specs/.current/spec.md`
   - Extract:
     - Functional requirements (FR-XXX items)
     - User stories and acceptance scenarios
     - Success criteria (SC-XXX items)
     - Key entities

2. **Read the implementation plan**
   - Read `/specs/.current/plan.md`
   - Extract:
     - All tasks with their verification criteria
     - Entity definitions
     - API contracts (if applicable)
     - Project structure changes

3. **Read any contract files**
   - Check `/specs/.current/contracts/` directory
   - Load OpenAPI or GraphQL schemas if present

### Phase 2: Task Verification

For each task in the implementation plan:

1. **Check task completion**
   - Locate the files/code mentioned in the task
   - Verify the implementation exists
   - Run the verification criteria specified in the task

2. **Record task status**
   - **PASS**: Task is fully implemented and verified
   - **PARTIAL**: Task is implemented but verification incomplete
   - **FAIL**: Task is not implemented or verification fails
   - **SKIP**: Task was intentionally skipped (note reason)

### Phase 3: Requirement Verification

For each functional requirement (FR-XXX) in the specification:

1. **Trace requirement to implementation**
   - Find the code that implements this requirement
   - Verify the implementation matches the requirement

2. **Check acceptance scenarios**
   - For each Given/When/Then scenario in user stories
   - Verify the scenario can be executed successfully
   - Check edge cases are handled

3. **Record requirement status**
   - **IMPLEMENTED**: Requirement is fully satisfied
   - **PARTIAL**: Requirement is partially implemented
   - **NOT IMPLEMENTED**: Requirement is missing
   - **DEVIATION**: Implementation differs from spec (note details)

### Phase 4: Entity Verification

For each entity defined in the plan:

1. **Verify entity exists**
   - Check database schema/models
   - Verify all fields are present with correct types

2. **Verify relationships**
   - Check foreign keys and associations
   - Verify cardinality matches the plan

3. **Verify validation rules**
   - Check that validation constraints are implemented

### Phase 5: Contract Verification (if applicable)

Skip if no contracts exist in `/specs/.current/contracts/`.

1. **Verify API endpoints**
   - Check each endpoint exists
   - Verify request/response schemas match contracts
   - Check error responses are implemented

2. **Run contract tests**
   - If contract tests exist, execute them
   - Note any failures

### Phase 6: Success Criteria Verification

For each success criterion (SC-XXX) in the specification:

1. **Evaluate measurability**
   - Can this criterion be measured with current implementation?
   - What evidence supports meeting this criterion?

2. **Record criterion status**
   - **MET**: Criterion is demonstrably satisfied
   - **PARTIALLY MET**: Some aspects satisfied
   - **NOT MET**: Criterion is not satisfied
   - **CANNOT VERIFY**: Requires manual testing or production data

### Phase 7: Generate Validation Report

Create a validation report with the following structure:

```markdown
# Validation Report: [FEATURE NAME]

**Validated**: [DATE]
**Spec**: `/specs/.current/spec.md`
**Plan**: `/specs/.current/plan.md`

## Summary

| Category | Pass | Partial | Fail | Total |
|----------|------|---------|------|-------|
| Tasks | X | X | X | X |
| Requirements | X | X | X | X |
| Entities | X | X | X | X |
| Contracts | X | X | X | X |
| Success Criteria | X | X | X | X |

**Overall Status**: [COMPLETE / INCOMPLETE / BLOCKED]

## Task Status

### Phase 1: [Phase Name]

- [x] **Task 1.1**: [Status] - [Notes]
- [ ] **Task 1.2**: [Status] - [Notes]

### Phase 2: [Phase Name]

- [x] **Task 2.1**: [Status] - [Notes]

## Requirement Status

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-001 | [Description] | IMPLEMENTED | [File/test reference] |
| FR-002 | [Description] | PARTIAL | [What's missing] |

## Entity Status

| Entity | Fields | Relationships | Validation | Status |
|--------|--------|---------------|------------|--------|
| [Name] | OK | OK | OK | PASS |

## Contract Status

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| /api/resource | POST | PASS | |
| /api/resource/:id | GET | FAIL | Missing error handling |

## Success Criteria Status

| ID | Criterion | Status | Evidence |
|----|-----------|--------|----------|
| SC-001 | [Description] | MET | [How verified] |
| SC-002 | [Description] | CANNOT VERIFY | [Why] |

## Issues Found

1. **[Issue Title]**
   - Location: [File/component]
   - Description: [What's wrong]
   - Impact: [How it affects the feature]
   - Recommendation: [How to fix]

## Recommendations

- [Action items for completing implementation]
- [Suggestions for improving coverage]
```

1. **Update spec status** (if overall status is COMPLETE)
    - Change status from "Implemented" to "Validated" in `spec.md`

## Phase Q: Quick Spec Validation

**Use this phase when only `/specs/.current/quick.md` exists.**

Skip Phases 1-7 and perform simplified validation:

### Q.1: Load Quick Spec

1. **Read the quick spec**
    - Read `/specs/.current/quick.md`
    - Extract:
        - Problem statement
        - Root cause analysis
        - Affected files list
        - Proposed solution
        - Verification checklist

### Q.2: Verify Affected Files

For each file listed in the "Affected Files" section:

1. **Check file exists**
    - Verify the file is present in the codebase

2. **Verify changes were made**
    - Check that the file was modified as described
    - Look for the specific changes mentioned in the solution

3. **Record file status**
    - **MODIFIED**: File was changed as expected
    - **UNCHANGED**: File exists but wasn't modified
    - **MISSING**: File doesn't exist

### Q.3: Run Verification Checklist

For each item in the "Verification" section of the quick spec:

1. **Execute verification step**
    - Run commands, check files, or perform manual verification
    - Note the outcome

2. **Record verification status**
    - **PASS**: Verification step succeeded
    - **FAIL**: Verification step failed
    - **SKIP**: Cannot verify (note reason)

### Q.4: Generate Quick Validation Report

Create a simplified validation report:

```markdown
# Quick Validation Report: [PROBLEM TITLE]

**Validated**: [DATE]
**Spec**: `/specs/.current/quick.md`
**Type**: Quick Spec

## Summary

| Category | Pass | Fail | Total |
|----------|------|------|-------|
| Affected Files | X | X | X |
| Verification Steps | X | X | X |

**Overall Status**: [COMPLETE / INCOMPLETE]

## Affected Files Status

| File | Expected Change | Status |
|------|-----------------|--------|
| [path] | [description] | MODIFIED |

## Verification Checklist

- [x] [Verification item 1] - PASS
- [ ] [Verification item 2] - FAIL: [reason]

## Issues Found

1. **[Issue Title]** (if any)
    - Description: [What's wrong]
    - Recommendation: [How to fix]

## Recommendations

- [Action items if incomplete]
```

1. **Update quick spec status** (if overall status is COMPLETE)
    - Change status from "Implemented" to "Validated" in `quick.md`

## Output

1. **Display the validation report** in the chat
2. **For quick specs**: Use the simplified Quick Validation Report format
3. **For full specs**: Use the comprehensive validation report format

## Guidelines

- **Evidence-based**: Every status must have supporting evidence
- **Non-destructive**: This workflow only reads and verifies, never modifies code
- **Comprehensive**: Check all items, don't skip any
- **Actionable**: Issues must include clear recommendations
- **Objective**: Report actual state, not expected state
