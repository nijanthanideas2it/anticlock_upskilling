# Implementation Plan: ServiceDesk CRM

**Branch**: `001-servicedesk-crm` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-servicedesk-crm/spec.md`

## Summary

A full-stack ServiceDesk CRM application enabling organizations to manage customer support operations. The backend is a Node.js/Express REST API with PostgreSQL via Prisma ORM, serving a React + Vite SPA frontend styled with Tailwind CSS. The system supports four roles (Admin, Support Manager, Support Agent, Customer), covers the complete ticket lifecycle with SLA tracking, automatic escalation, Firebase push and email notifications via AWS SES, and a reporting dashboard — all deployed on AWS.

## Technical Context

**Language/Version**: TypeScript 5.x (shared across frontend and backend)

**Primary Dependencies**:
- Frontend: React 18, Vite 5, Tailwind CSS 3, React Router v6, TanStack Query v5, Axios, React Hook Form, Zod, Zustand, Recharts
- Backend: Node.js 20 LTS, Express 4, Prisma 5, jsonwebtoken, bcryptjs, nodemailer, @aws-sdk/client-ses, firebase-admin, multer, @aws-sdk/client-s3, node-cron, swagger-ui-express, zod, helmet, express-rate-limit

**Storage**: PostgreSQL 15 (AWS RDS), AWS S3 (file attachments)

**Testing**: Backend — Jest + Supertest; Frontend — Vitest + React Testing Library

**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge — desktop + tablet responsive), deployed on AWS (ECS Fargate + RDS + S3 + CloudFront)

**Project Type**: Web application — React SPA frontend + Express REST API backend

**Performance Goals**: API p95 ≤200ms; ticket list loads ≤2s; dashboard renders ≤3s; 500 concurrent active users

**Constraints**: OWASP Top 10 compliance; WCAG 2.1 AA accessibility; ≥80% test line coverage; 100% branch coverage on auth and ticket mutation paths; no secrets in source; all API routes under `/api/v1/`; attachment limit: 10 MB per file, max 5 files per ticket

**Scale/Scope**: Single-tenant; up to 500 concurrent users; up to 6 months reporting history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Clean Architecture** — Backend: Controllers → Services → Repositories (Prisma); no controller imports repositories directly. Frontend: Pages → Hooks → Services → Axios API client. ESLint import rules enforce layer boundaries.
- [x] **II. TypeScript** — `"strict": true` in both `backend/tsconfig.json` and `frontend/tsconfig.json`; no `any`; Zod schemas provide runtime type safety at all boundaries; explicit return types on all exported functions.
- [x] **III. Code Quality** — ESLint (eslint-config-airbnb-typescript) + Prettier in both projects; Husky + lint-staged pre-commit hooks; complexity ≤10; functions ≤50 lines; files ≤300 lines.
- [x] **IV. Security** — Zod validation on all controller inputs; JWT stored in httpOnly cookies (XSS-safe); bcrypt cost factor 12; CORS strict origin; helmet.js headers; express-rate-limit on auth endpoints; dotenv-safe (no missing env vars at startup); npm audit in CI.
- [x] **V. API Standards** — All routes versioned under `/api/v1/`; RESTful verbs + standard HTTP status codes; uniform error envelope `{ "error": { "code": string, "message": string } }`; Swagger UI served at `/api/docs`.
- [x] **VI. Test Coverage** — Jest (backend) + Vitest (frontend); CI coverage gate at 80%; auth and ticket mutation endpoint suites target 100% branch coverage.
- [x] **VII. Performance** — Prisma eager loading / `include` on all list queries; composite indexes on `(assigneeId, status)`, `(customerId, status)`, `(createdAt)`, `(slaResponseDue)`, `(slaResolutionDue)`; node-cron SLA jobs run every 60 seconds; TanStack Query caching on frontend; Recharts lazy-loaded.
- [x] **VIII. UX Consistency** — Shared component library in `frontend/src/components/common/`; every page implements loading skeleton, error state, and empty state components; axe-core accessibility CI check; all interactive elements provide 100ms visual feedback.

> No constitution violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-servicedesk-crm/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth.md
│   ├── tickets.md
│   ├── users.md
│   ├── notifications.md
│   └── reports.md
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/           # Route handlers — input validation + response only
│   │   ├── auth.controller.ts
│   │   ├── ticket.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── attachment.controller.ts
│   │   ├── user.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── category.controller.ts
│   │   ├── sla.controller.ts
│   │   ├── notification.controller.ts
│   │   └── report.controller.ts
│   ├── services/              # Business logic — orchestrates repositories
│   │   ├── auth.service.ts
│   │   ├── ticket.service.ts
│   │   ├── comment.service.ts
│   │   ├── sla.service.ts
│   │   ├── escalation.service.ts
│   │   ├── assignment.service.ts
│   │   ├── notification.service.ts
│   │   └── report.service.ts
│   ├── repositories/          # Prisma DB access — no business logic
│   │   ├── user.repository.ts
│   │   ├── ticket.repository.ts
│   │   ├── comment.repository.ts
│   │   ├── customer.repository.ts
│   │   ├── sla.repository.ts
│   │   ├── notification.repository.ts
│   │   └── audit.repository.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification + user hydration
│   │   ├── rbac.middleware.ts       # Role-based access control factory
│   │   ├── validate.middleware.ts   # Zod schema validation factory
│   │   ├── error.middleware.ts      # Uniform error envelope
│   │   └── upload.middleware.ts     # Multer + S3 presigned URL config
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── ticket.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── attachment.routes.ts
│   │   ├── user.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── category.routes.ts
│   │   ├── sla.routes.ts
│   │   ├── notification.routes.ts
│   │   └── report.routes.ts
│   ├── jobs/
│   │   └── sla-monitor.job.ts       # node-cron SLA deadline checker (every 60s)
│   ├── notifications/
│   │   ├── email.provider.ts        # AWS SES via nodemailer
│   │   └── push.provider.ts         # Firebase Admin SDK (FCM)
│   ├── schemas/                     # Zod validation schemas (request bodies)
│   │   ├── auth.schema.ts
│   │   ├── ticket.schema.ts
│   │   ├── comment.schema.ts
│   │   └── user.schema.ts
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript interfaces
│   ├── utils/
│   │   ├── business-hours.ts        # SLA business-hours elapsed time calculator
│   │   ├── round-robin.ts           # Agent auto-assignment algorithm
│   │   ├── audit.ts                 # Audit log helper
│   │   └── reference-number.ts     # Ticket reference number generator
│   └── config/
│       ├── app.ts                   # Express app bootstrap
│       ├── database.ts              # Prisma client singleton
│       └── swagger.ts               # Swagger/OpenAPI config
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                      # Default categories + admin user
│   └── migrations/
└── tests/
    ├── unit/
    │   ├── services/
    │   └── utils/
    ├── integration/
    │   └── routes/
    └── contract/

frontend/
├── src/
│   ├── components/
│   │   ├── common/                  # Shared design-system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorState.tsx
│   │   ├── tickets/
│   │   │   ├── TicketCard.tsx
│   │   │   ├── TicketList.tsx
│   │   │   ├── TicketForm.tsx
│   │   │   ├── TicketTimeline.tsx
│   │   │   ├── CommentBox.tsx
│   │   │   └── SlaIndicator.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationList.tsx
│   │   └── dashboard/
│   │       ├── StatCard.tsx
│   │       ├── TicketTrendChart.tsx
│   │       ├── SlaComplianceChart.tsx
│   │       └── AgentPerformanceTable.tsx
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── tickets/
│   │   │   ├── TicketListPage.tsx
│   │   │   ├── TicketDetailPage.tsx
│   │   │   └── CreateTicketPage.tsx
│   │   ├── admin/
│   │   │   ├── UserManagementPage.tsx
│   │   │   ├── SLAManagementPage.tsx
│   │   │   └── CategoryManagementPage.tsx
│   │   └── dashboard/
│   │       └── ReportingDashboardPage.tsx
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth state + login/logout actions
│   │   ├── useTickets.ts            # TanStack Query ticket hooks
│   │   ├── useNotifications.ts      # Notification polling + mark-read
│   │   └── useReports.ts            # Report data fetching
│   ├── services/
│   │   ├── api.ts                   # Axios instance + JWT interceptor
│   │   ├── auth.service.ts
│   │   ├── ticket.service.ts
│   │   ├── comment.service.ts
│   │   ├── user.service.ts
│   │   ├── notification.service.ts
│   │   └── report.service.ts
│   ├── store/
│   │   └── auth.store.ts            # Zustand — current user + token state
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── date.ts                  # SLA deadline formatting + relative time
│       └── formatters.ts
└── tests/
    ├── unit/
    └── integration/
```

**Structure Decision**: Web application layout. `backend/` is a standalone Express REST API; `frontend/` is a standalone React + Vite SPA. Both reside in the repository root as sibling directories. Shared TypeScript types are duplicated for v1 simplicity (no shared package). AWS S3 for file storage is external infrastructure, not a code project.

## Complexity Tracking

> No violations — all principles satisfied without exceptions.
