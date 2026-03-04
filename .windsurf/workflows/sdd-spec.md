---
description: Create a high-level feature specification from a user description (v1.5.0)
---

# Create Feature Specification

This workflow generates a structured feature specification document from a user's
feature description. The specification captures user scenarios, functional
requirements, and success criteria in a technology-agnostic format.

## Input

The workflow requires a feature description as input (the `$ARGUMENTS` provided
by the user). If no description is provided, stop and report:
**ERROR: No feature description provided.**

## Steps

### Phase 1: Context Gathering

1. **Read the repository README**
   - Understand what the product does and its purpose
   - Identify the target audience
   - Note existing capabilities and concepts
   - This context informs how the new feature fits into the product

2. **Extract key concepts from the feature description**
   Identify and list:
   - **Actors**: Who interacts with this feature?
   - **Actions**: What do they do?
   - **Data**: What information is involved?
   - **Constraints**: What limitations or rules apply?

3. **Handle ambiguity**
   For unclear aspects:
   - Make informed guesses based on context and industry standards
   - Only mark with `[NEEDS CLARIFICATION: specific question]` if:
     - The choice significantly impacts feature scope or user experience
     - Multiple reasonable interpretations exist with different implications
     - No reasonable default exists
   - Prioritize clarifications by impact: **scope > security/privacy > UX > technical details**

### Phase 2: User Scenarios

1. **Define user stories as prioritized journeys**
   - Order stories by importance (P1, P2, P3, etc.)
   - Each story must be **independently testable** — implementing just one
     should deliver a viable MVP slice
   - Include for each story:
     - Brief title and priority
     - Plain language description of the journey
     - Why this priority (value explanation)
     - How it can be tested independently
     - Acceptance scenarios in Given/When/Then format

2. **Identify edge cases**
   - Boundary conditions
   - Error scenarios
   - Unusual but valid inputs

If no clear user flow can be determined, stop and report:
**ERROR: Cannot determine user scenarios from the provided description.**

### Phase 3: Requirements

1. **Generate functional requirements**
   - Each requirement must be testable
   - Use MUST/SHOULD/MAY language for clarity
   - Use reasonable defaults for unspecified details
   - Document assumptions separately
   - Mark truly ambiguous requirements with `[NEEDS CLARIFICATION: ...]`

2. **Identify key entities** (if the feature involves data)
   - What entities are involved?
   - What are their key attributes (without implementation details)?
   - How do they relate to each other?

### Phase 4: Success Criteria

1. **Define measurable outcomes**
   - Technology-agnostic and verifiable
   - Include both:
     - **Quantitative metrics**: time, performance, volume
     - **Qualitative measures**: user satisfaction, task completion
   - Each criterion must be verifiable without implementation details

### Phase 5: Write Specification

1. **Create the specification file**
   - Write to `specs/.current/spec.md`
   - Create the `specs/.current/` directory if it doesn't exist
   - Use the template structure below
   - Replace all placeholders with concrete details
   - Preserve section order and headings

2. **Review the specification**
   - Verify all mandatory sections are filled
   - Check that requirements are testable
   - Ensure success criteria are measurable
   - Confirm user stories are independently valuable

## Specification Template

```markdown
# Feature Specification: [FEATURE NAME]

**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## Assumptions

<!--
  Document any assumptions made when details were not specified.
  These inform reviewers what defaults were chosen and why.
-->

- [Assumption 1]: [Reasoning]
- [Assumption 2]: [Reasoning]

## User Scenarios & Testing

<!--
  User stories are PRIORITIZED journeys ordered by importance.
  Each story must be INDEPENDENTLY TESTABLE - implementing just ONE
  should deliver a viable MVP slice that provides value.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [How this can be tested independently and what value it
delivers]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [How this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements

### Functional Requirements

- **FR-001**: System MUST [specific capability]
- **FR-002**: System MUST [specific capability]
- **FR-003**: Users MUST be able to [key interaction]

### Key Entities

<!--
  Include this section only if the feature involves data.
  Describe entities at a conceptual level without implementation details.
-->

- **[Entity 1]**: [What it represents, key attributes]
- **[Entity 2]**: [What it represents, relationships]

## Success Criteria

### Measurable Outcomes

- **SC-001**: [Quantitative metric, e.g., "Users complete task in under 2
  minutes"]
- **SC-002**: [Performance metric, e.g., "System handles N concurrent users"]
- **SC-003**: [Quality metric, e.g., "90% of users complete primary task on
  first attempt"]
```

## Guidelines

- **Technology-agnostic**: Focus on what, not how
- **Testable requirements**: Every FR must have a clear pass/fail condition
- **Independent stories**: Each user story should be a viable MVP slice
- **Reasonable defaults**: Don't over-ask for clarification; make informed
  choices and document them as assumptions
- **Prioritize by impact**: Scope-affecting ambiguities matter more than
  technical details
- **Preserve context**: Reference how the feature fits into the existing product
