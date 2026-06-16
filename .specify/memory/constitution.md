<!--
## Sync Impact Report

**Version change**: (unfilled template) → 1.0.0
**Modified principles**: All 8 principles newly ratified (none previously defined)
**Added sections**:
  - I. Clean Architecture
  - II. TypeScript
  - III. Code Quality
  - IV. Security
  - V. API Standards
  - VI. Test Coverage
  - VII. Performance
  - VIII. User Experience Consistency
  - Development Workflow
  - Quality Gates & Release Process
**Removed sections**: None (template placeholders removed)
**Templates updated**:
  - ✅ `.specify/templates/plan-template.md` — Constitution Check gate updated with 8 principles
  - ✅ `.specify/templates/spec-template.md` — Non-functional requirements hints added
  - ✅ `.specify/templates/tasks-template.md` — Polish phase updated with constitution-aligned tasks
**Deferred TODOs**: None
-->

# ServiceDesk CRM Constitution

## Core Principles

### I. Clean Architecture

All code MUST follow strict layer separation: Controllers → Services → Repositories → Models.
Domain logic MUST NOT import from infrastructure concerns (databases, HTTP clients, file system).
Dependencies flow inward only; inner layers have no knowledge of outer layers.
Dependency injection MUST be used over hard-coded instantiation so each layer is independently testable.
Cross-layer shortcuts (e.g., a controller calling a repository directly) are prohibited without a documented exception in the Complexity Tracking table.

### II. TypeScript

TypeScript strict mode MUST be enabled (`"strict": true` in `tsconfig.json`) across all packages — non-negotiable.
The `any` type is prohibited unless accompanied by an inline comment justifying why a typed alternative is not feasible.
All exported and public functions MUST declare explicit return types.
Interfaces MUST be used for object shapes; type aliases are reserved for unions, intersections, and primitive aliases.
`unknown` MUST be used instead of `any` when the type is genuinely unknown at compile time.

### III. Code Quality

ESLint and Prettier MUST pass in CI on every pull request; failing checks block merge.
Cyclomatic complexity MUST NOT exceed 10 per function.
Functions MUST NOT exceed 50 lines; source files MUST NOT exceed 300 lines.
Commented-out code is prohibited in production branches; remove or open a ticket instead.
Lint and format checks MUST run as pre-commit hooks to catch violations before push.

### IV. Security

All user-supplied inputs MUST be validated and sanitized at system boundaries (API controllers, CLI entry points).
Secrets, tokens, API keys, and credentials MUST NOT appear in source code, log output, or commit history.
Authentication is required on every non-public API endpoint; JWT or session-based auth MUST be applied consistently.
OWASP Top 10 compliance is mandatory; a SAST scan MUST run in CI and block merge on critical/high findings.
Dependency vulnerability audits MUST run on every push to `main`.

### V. API Standards

RESTful conventions MUST be followed: correct HTTP verbs (GET/POST/PUT/PATCH/DELETE), idempotent operations where applicable, and standard status codes.
All API routes MUST be versioned under `/api/v1/…`; breaking changes require a new version prefix.
An OpenAPI/Swagger specification MUST be maintained and kept in sync with the implementation; drift blocks release.
All error responses MUST use the uniform envelope: `{ "error": { "code": string, "message": string } }`.
Paginated list endpoints MUST support cursor- or offset-based pagination and MUST NOT return unbounded result sets.

### VI. Test Coverage

The codebase MUST maintain a minimum of 80% line coverage across unit and integration tests combined.
Authentication, billing, and data-mutation code paths MUST reach 100% branch coverage.
Tests SHOULD be written before or alongside implementation (TDD encouraged); no feature is "done" without passing tests.
PRs are blocked from merge if any test suite fails in CI.
Integration tests MUST target real external dependencies (database, message broker) — mocks are permitted only for third-party services outside the team's control.

### VII. Performance

Standard CRUD API endpoints MUST achieve p95 response time ≤200ms under expected load.
N+1 query patterns are prohibited; all list queries MUST use eager-loading, batching, or cursor pagination.
Database queries touching more than 1 000 rows MUST use appropriate indexes, verified via query explain plans.
Frontend bundle size increases of more than 10% relative to the previous release require explicit justification in the PR description.
Performance benchmarks MUST be run and compared against the established baseline before every production release.

### VIII. User Experience Consistency

All UI MUST use established design-system components; bespoke one-off components are prohibited without design team sign-off.
Every user-facing feature MUST implement three states: loading, error, and empty — all three are mandatory, not optional.
WCAG 2.1 AA accessibility compliance is required across all UI surfaces; automated accessibility checks run in CI.
UI interactions MUST provide visible feedback within 100ms of a user action (button press, form submit, navigation).
Error messages shown to users MUST be human-readable and actionable; technical stack traces MUST NOT be exposed in the UI.

## Development Workflow

Feature branches MUST be named `[###-short-description]` and branched from `main`.
All pull requests require at least one peer review approval before merge.
The CI pipeline runs in this order: lint → type-check → test → security scan → coverage gate; all steps MUST pass.
All services and libraries MUST follow Semantic Versioning (SemVer); version bumps accompany every release.
Commits SHOULD be atomic and scoped to a single logical change; commit messages MUST be descriptive and follow Conventional Commits format.

## Quality Gates & Release Process

The Constitution Check (all 8 principles) is a mandatory gate in every PR review checklist; reviewers MUST attest compliance.
Security SAST scan and dependency audit MUST run on every push to `main` and on every release candidate.
Performance benchmarks MUST be compared against the established baseline before every production release.
An accessibility audit (automated CI check plus manual spot-check of new UI) is required before any feature reaches production.
The OpenAPI specification MUST be validated against the running implementation before a release is tagged.

## Governance

This constitution supersedes all other development guidelines, coding standards, and team conventions.
Amendments require a documented rationale, team consensus (recorded in a PR or ADR), and a version bump following SemVer:
- MAJOR: removal or redefinition of a principle (breaking governance change)
- MINOR: addition of a new principle or materially expanded guidance
- PATCH: clarifications, wording fixes, non-semantic refinements

All PRs and code reviews MUST verify compliance with these 8 principles; reviewers sign off on the Constitution Check gate.
Justified exceptions to any principle MUST be recorded in the Complexity Tracking table in the relevant `plan.md`.
The `CLAUDE.md` agent context file references this constitution; run `/speckit-agent-context-update` after any amendment.

**Version**: 1.0.0 | **Ratified**: 2026-06-13 | **Last Amended**: 2026-06-13
