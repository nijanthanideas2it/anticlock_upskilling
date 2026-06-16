# Research: ServiceDesk CRM

**Phase**: 0 — Technical Decision Research
**Date**: 2026-06-13
**Feature**: specs/001-servicedesk-crm/

All decisions below resolve technical unknowns identified during plan creation and establish best-practice defaults for each concern.

---

## 1. JWT Storage Strategy

**Decision**: Access token stored in `httpOnly`, `SameSite=Strict` cookie; refresh token stored in a separate `httpOnly` cookie with longer expiry. Access token TTL: 15 minutes. Refresh token TTL: 7 days.

**Rationale**: httpOnly cookies are inaccessible to JavaScript, preventing XSS-based token theft. `SameSite=Strict` mitigates CSRF without requiring a separate CSRF token for same-origin navigation. State-changing requests from different origins are blocked by CORS allowlist. This pattern is safer than localStorage (XSS-vulnerable) and more ergonomic than bearer-in-header with client-side storage.

**Alternatives considered**:
- localStorage with Authorization header — rejected: directly exposed to XSS
- In-memory storage with refresh on reload — rejected: poor UX (logout on tab close/refresh)

---

## 2. SLA Monitoring Architecture

**Decision**: `node-cron` job scheduled every 60 seconds. On each tick, the job queries all tickets where `status NOT IN (RESOLVED, CLOSED)` and `slaResponseDue` or `slaResolutionDue` is in the past or within the warning window. It calls `SlaService.evaluateTicket()` for each hit, which updates `slaStatus`, creates `EscalationEvent` records, and triggers notifications.

**Rationale**: 60-second polling precision is sufficient for SLA policies measured in hours and minutes. No additional infrastructure is needed for single-tenant v1. The query is index-covered on `(slaResponseDue)` and `(slaResolutionDue)`.

**Alternatives considered**:
- BullMQ + Redis delayed jobs (per-ticket timers) — rejected: adds Redis infrastructure dependency for v1; overkill for single-tenant scale
- PostgreSQL `pg_cron` extension — rejected: ties business logic to the database layer (violates Clean Architecture Principle I)

---

## 3. File Attachment Storage

**Decision**: AWS S3 with a two-step upload flow. The backend issues a presigned S3 PUT URL via `@aws-sdk/client-s3`. The frontend uploads the file directly to S3 (bypassing the backend), then sends the resulting `storageKey` to the backend to record the attachment in the database. Download uses presigned GET URLs generated on demand.

**Rationale**: Files never transit the backend process, keeping backend memory footprint low and upload throughput high. S3 handles durability and CDN distribution via CloudFront. Max file size (10 MB) enforced both on the presigned URL condition and as a frontend guard.

**Alternatives considered**:
- Multer streaming to S3 through the backend — rejected: ties file throughput to backend memory and increases request size on the API server
- Local filesystem storage — rejected: ephemeral on ECS Fargate; not production-viable

---

## 4. Notification Architecture

**Decision**:
- **In-app notifications**: Stored in the `Notification` table with `channel = IN_APP`. Frontend polls `/api/v1/notifications` every 30 seconds using TanStack Query with `refetchInterval`. Unread count displayed in `NotificationBell`. Firebase Cloud Messaging (FCM) used for browser push notifications (optional; user must grant permission).
- **Email notifications**: AWS SES via `nodemailer` with SES transport. Templates are plain-text + HTML strings in `backend/src/notifications/templates/`. Sent asynchronously (fire-and-forget within the notification service; delivery tracked by `isDelivered` flag).

**Rationale**: Polling at 30-second intervals is adequate for a support desk context and avoids the operational complexity of WebSockets or SSE for v1. Firebase handles cross-browser push with a single SDK. SES provides reliable, high-deliverability email at AWS-native cost.

**Alternatives considered**:
- WebSockets / Socket.io for real-time in-app notifications — rejected: stateful connections require sticky sessions or Redis pub/sub; complexity not justified for v1 polling cadence
- SendGrid / Mailgun for email — rejected: SES is cheaper and already within the AWS deployment boundary; no additional vendor

---

## 5. Agent Auto-Assignment (Round-Robin)

**Decision**: On ticket creation, `AssignmentService` queries all available agents (`isAvailable = true`, `role = SUPPORT_AGENT`, `isActive = true`) ordered by `assignedTicketCount ASC` (derived from a subquery count of non-closed tickets). The agent with the fewest open assigned tickets is selected. Ties are broken by `createdAt ASC` (longest-standing agent gets priority).

**Rationale**: Load-balanced assignment is fairer and more operationally useful than a strict rotating pointer that doesn't account for ticket volume differences. A pure count-based approach requires no extra state column, is correct across restarts, and is a single Prisma query.

**Alternatives considered**:
- Redis INCR atomic counter for round-robin pointer — rejected: adds Redis dependency; count-based approach is more operationally meaningful
- Strict sequential round-robin with DB pointer — rejected: doesn't adapt to agents who resolve tickets faster

---

## 6. Business Hours SLA Calculation

**Decision**: Custom utility `backend/src/utils/business-hours.ts` uses `date-fns` and `date-fns-tz`. The utility reads the `BusinessHours` table (Mon–Fri 09:00–17:00 UTC by default) and calculates the wall-clock deadline for a given SLA duration in minutes, skipping non-business periods. This function is called at ticket creation to set `slaResponseDue` and `slaResolutionDue` timestamps.

**Rationale**: Timezone-aware calculation without external API calls; deterministic and unit-testable with fixed inputs. Snapshotting due dates at creation time means the SLA monitor job performs a simple timestamp comparison on each tick rather than recalculating business hours on every poll.

**Alternatives considered**:
- Third-party SLA/business-hours npm packages — rejected: sparse maintenance, opaque behaviour for business-hours edge cases (DST, midnight spans)
- Calculating SLA remaining time dynamically on each monitor tick — rejected: expensive for large ticket volumes; snapshotting is standard practice in SLA systems

---

## 7. Report Generation Strategy

**Decision**: On-demand PostgreSQL aggregation queries executed by `ReportService`. Indexes on `(createdAt)`, `(resolvedAt)`, `(assigneeId, status)`, and `(slaStatus)` ensure queries over 6-month ranges remain fast at single-tenant scale (expected: <100 k tickets). No pre-computed snapshots or materialized views for v1.

**Rationale**: At 500 concurrent users, aggregate queries with proper indexes will return within the 3-second target. Pre-computed caches introduce invalidation complexity that is premature at this scale.

**Alternatives considered**:
- PostgreSQL materialized views refreshed nightly — rejected: stale data intraday; invalidation logic adds complexity
- Separate OLAP store (Redshift, ClickHouse) — rejected: massively over-engineered for single-tenant v1

---

## 8. Password Reset and Agent Invitation Tokens

**Decision**: Cryptographically random UUID tokens stored in `PasswordReset` and as `invitationToken` on `User`, with an `expiresAt` timestamp. Sent via email link pointing to the frontend reset/set-password page. Tokens are single-use and expire after 1 hour (invitation: 48 hours).

**Rationale**: Standard, auditable pattern. No reliance on JWT for reset tokens avoids the inability to revoke them before expiry. Single-use + expiry satisfies OWASP account-recovery guidelines.

**Alternatives considered**:
- JWT-signed reset tokens — rejected: cannot be invalidated server-side without a denylist (which requires a DB lookup anyway, eliminating the JWT statelessness benefit)

---

## 9. Soft Delete Implementation

**Decision**: All main entities include a `deletedAt DateTime?` field. A Prisma middleware extension (`prisma.$extends`) automatically appends `WHERE deletedAt IS NULL` to all `findMany`, `findFirst`, and `findUnique` queries. Hard deletes are not exposed through any API endpoint.

**Rationale**: Preserves referential integrity (audit logs, escalation events retain their ticket/user references). Allows administrative data recovery. Consistent with spec Assumption: "Soft delete used for all records."

**Alternatives considered**:
- Separate `archived` tables — rejected: complex migrations, duplicate schemas
- Application-level filter in every repository method — rejected: error-prone; middleware is DRY and enforced globally

---

## 10. Frontend State Management

**Decision**:
- **Server state** (tickets, notifications, reports, users): TanStack Query v5. Handles caching, background refetch, loading/error states automatically.
- **Auth / UI state** (current user, token presence, role): Zustand store (`auth.store.ts`). Persisted to `sessionStorage` so state survives page refresh but clears on tab close.

**Rationale**: TanStack Query eliminates manual fetch/loading/error boilerplate, aligns with constitution Principle VIII (consistent loading/error states), and reduces state complexity. Zustand is lightweight and avoids Redux ceremony for simple global state.

**Alternatives considered**:
- Redux Toolkit — rejected: significant boilerplate for auth-only global state; TanStack Query handles the bulk of state that Redux would otherwise manage
- Context API for auth — rejected: causes unnecessary re-renders on token refresh; Zustand is more performant and ergonomic

---

## 11. CSAT Collection

**Decision**: After a ticket is resolved, the backend sets a `csatWindowExpiresAt` computed as `resolvedAt + 7 days`. A notification (email + in-app) is sent with a link/modal to rate the experience (1–5 stars + optional text comment). The rating is submitted via `POST /api/v1/tickets/:id/csat`. After submission or window expiry, no further rating is accepted.

**Rationale**: Matches spec (7-day window, 1–5 stars). Rating stored directly on the Ticket record for simple aggregation in reports.

---

## 12. Security Hardening Checklist (Implementation Reference)

| Control | Implementation |
|---|---|
| Helmet.js HTTP headers | `app.use(helmet())` in `config/app.ts` |
| CORS allowlist | `ALLOWED_ORIGINS` env var; reject unknown origins |
| Rate limiting | `express-rate-limit`: 10 req/15min on `/auth/login`, `/auth/register` |
| Input validation | Zod schemas on all request bodies + query params |
| SQL injection | Prisma parameterized queries (no raw SQL) |
| XSS | httpOnly cookies + Helmet CSP header |
| Secrets management | `dotenv-safe` enforces all required env vars at startup; `.env.example` committed |
| Dependency audit | `npm audit --audit-level=high` in CI |
| Password hashing | bcrypt with cost factor 12 |
| Attachment type validation | MIME type allowlist: images, PDF, Word, Excel, plain text |
