---
description: Create an implementation plan from a feature specification (v1.5.0)
---

# Create Implementation Plan

This workflow generates a structured implementation plan from a feature
specification created by `/sdd-spec`. The plan includes technical context,
research findings, entity definitions, API contracts, and actionable tasks.

## Input

The workflow accepts optional user input (`$ARGUMENTS`) to provide additional
context or constraints for the implementation plan. Examples:

- Technology preferences: "Use Redis for caching"
- Scope constraints: "Focus on the API layer only"
- Priority guidance: "Prioritize performance over simplicity"
- Clarifications: Answers to questions marked in the spec

If no arguments are provided, the workflow proceeds using only the feature spec
and codebase analysis.

## Prerequisites

Check for the existence of `/specs/.current/spec.md`. If it does not exist:

**ERROR: Feature specification not found at `/specs/.current/spec.md`. Please
run `/sdd-spec` first to create a feature specification.**

## Steps

### Phase 1: Context Gathering

1. **Read the feature specification**
   - Read `/specs/.current/spec.md`
   - Extract the feature name, requirements, user scenarios, and success criteria
   - Note any clarifications marked in the spec

2. **Process user input** (if provided)
   - Parse `$ARGUMENTS` for technology preferences, constraints, or clarifications
   - Use user input to resolve "NEEDS CLARIFICATION" items from the spec
   - Note any constraints that affect technical decisions

3. **Read the repository context**
   - Read `README.md` to understand the product
   - Read `DEVELOPMENT.md` for development setup and patterns (if exists)
   - Scan existing source directories to understand current architecture

4. **Fill Technical Context**
   Determine the following from the codebase. Mark as "NEEDS CLARIFICATION" if
   cannot be determined:
   - **Language/Version**: Programming language and version
   - **Primary Dependencies**: Key frameworks and libraries
   - **Storage**: Database or persistence mechanism (if applicable)
   - **Testing**: Test framework in use
   - **Target Platform**: Deployment target
   - **Project Type**: single/web/mobile/monorepo
   - **Performance Goals**: Domain-specific targets
   - **Constraints**: Technical limitations
   - **Scale/Scope**: Expected usage scale

### Phase 2: Research

1. **Research unknowns**
   For each "NEEDS CLARIFICATION" item in Technical Context:
   - Search the codebase for related patterns
   - Search the web for best practices in the domain
   - Document findings with sources

2. **Research technology choices**
   For each technology in the stack:
   - Find best practices for that technology in the feature's domain
   - Identify common patterns and anti-patterns
   - Note any version-specific considerations

3. **Consolidate findings**
   - Summarize research in the Research section
   - Link to relevant documentation or resources
   - Highlight decisions that need user input

### Phase 3: Entity Extraction

1. **Extract entities from the feature spec**
   For each entity identified:
   - **Name**: Entity identifier
   - **Fields**: Key attributes with types
   - **Relationships**: How it relates to other entities
   - **Validation rules**: Constraints from requirements
   - **State transitions**: Lifecycle states (if applicable)

2. **Map to existing entities**
   - Check if entities already exist in the codebase
   - Identify modifications needed to existing entities
   - Note new entities to be created

### Phase 4: API Contracts (if applicable)

Skip this phase if the feature does not require API endpoints.

1. **Generate contracts from functional requirements**
   For each user action that requires an API:
   - Define the endpoint (method, path, parameters)
   - Specify request/response schemas
   - Document error responses
   - Use standard REST or GraphQL patterns

2. **Output contract files**
   - Create `/specs/.current/contracts/` directory if needed
   - Write OpenAPI (for REST) or GraphQL schema files
   - Reference contracts in the plan

### Phase 5: Project Structure

1. **Analyze current structure**
   - Review existing directory layout
   - Identify where new code should be placed
   - Follow existing patterns and conventions

2. **Plan structural changes**
   - List new directories to create
   - List new files to create
   - Note modifications to existing structure

### Phase 6: Task Breakdown

1. **Generate implementation tasks**
   Based on Research, Entities, Contracts, and Structure:
   - Break down into discrete, testable tasks
   - Order tasks by dependency (prerequisites first)
   - Estimate complexity (S/M/L)
   - Group related tasks into phases

2. **Include verification tasks**
   - Unit tests for each component
   - Integration tests for workflows
   - Manual verification steps

### Phase 7: Write Plan

1. **Create the implementation plan**
   - Write to `/specs/.current/plan.md`
   - Use the template structure below
   - Replace all placeholders with concrete details

2. **Create contract files** (if applicable)
   - Write to `/specs/.current/contracts/`
   - Use OpenAPI 3.0 or GraphQL SDL format

3. **Review the plan**
   - Verify all sections are complete
   - Check that tasks are actionable
   - Ensure dependencies are clear

## Implementation Plan Template

```markdown
# Implementation Plan: [FEATURE]

**Input**: Feature specification from `/specs/.current/spec.md`
**User Input**: [If provided: "$ARGUMENTS" or "None"]

## Summary

[Extract from feature spec: primary requirement + technical approach from
research]

## Technical Context

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS
CLARIFICATION]
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps
or NEEDS CLARIFICATION]
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory,
offline-capable or NEEDS CLARIFICATION]
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS
CLARIFICATION]

## Project Structure

[Explain the changes to the project structure]

## Research

### [Topic 1]

[Findings and recommendations]

### [Topic 2]

[Findings and recommendations]

## Entities

### [Entity Name]

- **Fields**:
    - `field1`: type - description
    - `field2`: type - description
- **Relationships**: [How it relates to other entities]
- **Validation**: [Rules from requirements]
- **States**: [If applicable: state1 → state2 → state3]

## Contracts

[Reference to contract files in `/specs/.current/contracts/` or "N/A - no API
endpoints required"]

### Endpoints Summary

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/resource | Create resource |
| GET | /api/resource/:id | Get resource |

## Tasks

### Phase 1: [Foundation]

- [ ] **Task 1.1** (S): [Description]
    - Prerequisites: None
    - Verification: [How to verify]

- [ ] **Task 1.2** (M): [Description]
    - Prerequisites: Task 1.1
    - Verification: [How to verify]

### Phase 2: [Core Implementation]

- [ ] **Task 2.1** (L): [Description]
    - Prerequisites: Phase 1
    - Verification: [How to verify]

### Phase 3: [Integration & Testing]

- [ ] **Task 3.1** (M): [Description]
    - Prerequisites: Phase 2
    - Verification: [How to verify]

```

## Guidelines

- **Absolute paths**: Always use absolute paths starting from repository root
- **Actionable tasks**: Each task should be completable in one work session
- **Testable outcomes**: Every task must have clear verification criteria
- **Dependency order**: Tasks must be ordered so prerequisites come first
- **Existing patterns**: Follow conventions already established in the codebase
- **Research-backed**: Technical decisions should reference research findings
