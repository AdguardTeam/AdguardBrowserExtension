---
description: Actualize README.md to serve as a user manual for an already running system (v1.5.0)
---

# Actualize README

This workflow updates `README.md` to comply with the README requirements: a user
manual for an already running system that explains what the product does and how
it can be used.

## Prerequisites

Before starting, verify the repository contains these required documents:

- `DEPLOYMENT.md` — installation, configuration, deployment
- `DEVELOPMENT.md` — development setup and workflow
- `CHANGELOG.md` — changelog
- `AGENTS.md` — LLM agent guidance
- `specs/` — directory containing feature specifications

If any are missing, ask the user whether to create them or proceed without.

## Steps

### Phase 1: Information Gathering

1. **Read the current README.md**
   - Review the existing content
   - Note what sections exist and their quality
   - Identify content that violates requirements (installation steps, config
     details, etc.)

2. **Gather product information from the codebase**
   - Read `AGENTS.md` for project overview and structure
   - Read `DEPLOYMENT.md` for understanding what the product does (not to copy
     content)
   - Read `DEVELOPMENT.md` for understanding capabilities
   - Scan `specs/` directory for feature specifications
   - Examine entry points (main files, CLI commands, API routes) to understand
     user interactions

3. **Identify information gaps**
   After gathering information, determine if you can answer these questions:
   - What does the product do? (purpose)
   - Who is it for? (target audience)
   - What problem does it solve?
   - What are the main concepts users interact with?
   - What can users do with it? (capabilities)
   - How do users interact with it at runtime?
   - What inputs does it accept and what outputs does it produce?
   - What guarantees does it provide?

   If any critical questions cannot be answered from the codebase,
   **ask the user for clarification** before proceeding.

### Phase 2: Content Planning

1. **Plan the README structure**
   Create an outline with these required sections:
   - Project name and purpose
   - Mental model
   - Capabilities
   - Using the product
   - Inputs and outputs
   - Behavior and guarantees
   - Documentation map

2. **Draft content for each section**
   For each section, note:
   - Key points to include
   - Content to exclude (installation, config, deployment details)
   - Examples that show usage (not setup)

### Phase 3: Writing

1. **Write the README**
   Apply these rules strictly:

   **Include:**
   - What the product does and who it's for
   - Main concepts and their relationships
   - User-facing capabilities (goal-oriented)
   - Runtime workflows and interactions
   - Input/output expectations
   - Behavioral guarantees and limits
   - Links to other documentation

   **Exclude (move to appropriate docs if present):**
   - Installation instructions
   - Configuration files or environment variables
   - Deployment manifests or scripts
   - Build steps
   - Developer workflows
   - Infrastructure or CI/CD details

2. **Add documentation map**
   Include relative links to:

   ```markdown
   ## Documentation

   - [Deployment and configuration](DEPLOYMENT.md)
   - [Development](DEVELOPMENT.md)
   - [Changelog](CHANGELOG.md)
   - [LLM agent rules](AGENTS.md)
   - [Feature specifications](specs/)
   ```

### Phase 4: Validation

1. **Review against requirements**
   Verify the README:
   - [ ] Describes what the product does (not how to install it)
   - [ ] Explains concepts users interact with
   - [ ] Lists user-facing capabilities
   - [ ] Shows runtime usage (not setup)
   - [ ] Documents inputs and outputs
   - [ ] Describes behavioral guarantees
   - [ ] Links to all required external documents
   - [ ] Contains NO installation/config/deployment/build content
   - [ ] Uses clear, neutral language (no marketing)

2. **Format and finalize**
    - Check markdown formatting
    - Ensure consistent heading levels
    - Verify all relative links work

## Guidelines

- **User manual, not tutorial**: Write as stable documentation, not a getting-started guide
- **Runtime focus**: Assume the system is already running and reachable
- **No duplication**: Link to other docs, don't copy their content
- **Examples show usage**: Demonstrate actual work, not setup steps
- **Ask when uncertain**: If product purpose or behavior is unclear, ask the user
- **Preserve valid content**: Don't discard good existing content that fits requirements
