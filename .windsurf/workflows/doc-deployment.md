---
description: Actualize DEPLOYMENT.md to document production deployment configuration (v1.5.0)
---

# Actualize DEPLOYMENT.md

This workflow creates or updates `DEPLOYMENT.md` to document the production
deployment configuration for a deployable application. It covers environment
variables, infrastructure dependencies, external integrations, error reporting,
and logging configuration.

**Note**: This document is optional. It is only relevant for deployable
applications, not for libraries or documentation-only projects.

## Prerequisites

Before starting, check if the project is deployable:

- Look for deployment artifacts (Dockerfile, docker-compose.yml, Procfile,
  serverless.yml, kubernetes manifests, etc.)
- Check for environment variable usage in the codebase
- Look for database connections, cache clients, or external API integrations

If the project appears to be a library or documentation-only project with no
deployment requirements, **ask the user** whether to proceed or skip this
workflow.

Also verify these documents exist (optional but recommended):

- `README.md` — project overview
- `DEVELOPMENT.md` — development setup
- `AGENTS.md` — LLM agent guidance

## Steps

### Phase 1: Information Gathering

1. **Read the current DEPLOYMENT.md** (if it exists)
    - Review existing content
    - Note what sections exist and their quality
    - Identify placeholder content that needs to be filled in
    - Identify outdated or incorrect information

2. **Analyze environment variable usage**
    - Search for `process.env`, `os.environ`, `env::var`, `os.Getenv`, or
      similar patterns
    - Check `.env.example`, `.env.sample`, or similar files
    - Look for configuration loading code (config files, settings modules)
    - Document each variable: name, purpose, required/optional, example value

3. **Detect infrastructure dependencies**
    - **Databases**: Look for connection strings, ORM configurations, database
      clients (PostgreSQL, MySQL, MongoDB, SQLite, etc.)
    - **Caches**: Look for Redis, Memcached, or other cache client usage
    - **Message queues**: Look for RabbitMQ, Kafka, SQS, or similar
    - **Object storage**: Look for S3, GCS, or blob storage clients
    - Document connection configuration for each

4. **Identify external integrations**
    - Search for API client initializations (Stripe, SendGrid, Twilio, etc.)
    - Look for OAuth/SSO provider configurations
    - Check for webhook endpoints that receive external calls
    - Document each integration and its required configuration

5. **Check error reporting configuration**
    - Look for Sentry SDK initialization (`Sentry.init`, `sentry_sdk.init`)
    - Check for other error reporting tools (Bugsnag, Rollbar, etc.)
    - Document DSN configuration and any custom options

6. **Analyze logging configuration**
    - Look for logging framework setup (winston, pino, logrus, Python logging)
    - Check where logs are written (stdout, files, external services)
    - Identify log format (JSON, plain text, structured)
    - Document log level configuration

7. **Identify health check endpoints** (optional)
    - Look for `/health`, `/ready`, `/live`, or similar endpoints
    - Document what each endpoint checks

8. **Identify information gaps**
    After gathering information, determine if you can document:
    - All required environment variables
    - All infrastructure dependencies and their connection config
    - All external integrations and their setup
    - Error reporting configuration
    - Logging output and format

    If critical information cannot be detected from the codebase,
    **ask the user for clarification** before proceeding.

### Phase 2: Content Planning

1. **Determine applicable sections**
    Based on gathered information, decide which sections to include:
    - Environment Variables (always include if any exist)
    - Infrastructure Dependencies (include if databases, caches, queues exist)
    - Integrations (include if external APIs or auth providers exist)
    - Error Reporting (include if Sentry or similar is configured)
    - Logging (include if logging configuration exists)
    - Health Checks (include if health endpoints exist)

2. **Plan content for each section**
    For each applicable section, note:
    - Specific items to document
    - Configuration details to include
    - Content to update or remove (if updating existing doc)

3. **Handle non-deployable projects**
    If no deployment configuration is detected:
    - Ask the user if the project has deployment requirements not visible in code
    - If confirmed non-deployable, suggest skipping this workflow

### Phase 3: Writing

1. **Create or update DEPLOYMENT.md**
    Apply these rules strictly:

    **Include:**
    - All environment variables with name, purpose, required/optional, example
    - Infrastructure dependencies with type, version, connection configuration
    - External integrations with purpose and required credentials
    - Error reporting setup (Sentry DSN, environment, release tracking)
    - Logging output location, format, and level configuration
    - Health check endpoints and their purpose

    **Exclude (belongs in other documents):**
    - Development setup (belongs in DEVELOPMENT.md)
    - Build instructions (belongs in DEVELOPMENT.md)
    - User-facing documentation (belongs in README.md)
    - Code guidelines (belongs in AGENTS.md)
    - CI/CD pipeline configuration (separate concern)

2. **Replace placeholder content**
    - Fill in all `<!-- comment -->` placeholders with actual content
    - Replace generic examples with project-specific values
    - Remove sections that don't apply to this project

3. **Handle secrets appropriately**
    - Never include actual secret values
    - Document that secrets should be provided via environment variables
    - Reference secrets management practices if applicable

### Phase 4: Validation

1. **Review against requirements**
    Verify the DEPLOYMENT.md:
    - [ ] Lists all environment variables with purpose and examples
    - [ ] Documents all infrastructure dependencies
    - [ ] Explains external integration configuration
    - [ ] Covers error reporting setup (if applicable)
    - [ ] Documents logging configuration
    - [ ] Contains NO development setup content
    - [ ] Contains NO placeholder/template comments
    - [ ] Does not expose actual secrets

2. **Cross-reference with codebase**
    - Verify documented env vars match what code actually uses
    - Confirm infrastructure dependencies are accurate
    - Check that integration configuration is complete

3. **Format and finalize**
    - Check markdown formatting
    - Ensure consistent heading levels
    - Verify all relative links work
    - Ensure tables are properly formatted

## Guidelines

- **Production focus**: Document what's needed to run in production, not develop
- **Security conscious**: Never include actual secrets, always use placeholders
- **Complete but concise**: Include all necessary config without excessive detail
- **Ask when uncertain**: If deployment requirements are unclear, ask the user
- **Preserve valid content**: Don't discard good existing content that fits
  requirements
- **Skip gracefully**: For non-deployable projects, confirm with user before
  skipping
- **No duplication**: Link to DEVELOPMENT.md for dev setup, README.md for usage
