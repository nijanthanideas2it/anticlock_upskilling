<!-- SPECKIT START -->
# ServiceDesk CRM

## Project Overview

This project is a ServiceDesk CRM system similar to Freshdesk.

## Current Feature Plan

See `specs/001-servicedesk-crm/plan.md` for the active implementation plan.

Key design artifacts:
- Data model: `specs/001-servicedesk-crm/data-model.md`
- API contracts: `specs/001-servicedesk-crm/contracts/`
- Technical decisions: `specs/001-servicedesk-crm/research.md`
- Validation guide: `specs/001-servicedesk-crm/quickstart.md`

## Technology Stack

Frontend:
- React 18 + Vite 5
- TypeScript (strict)
- Tailwind CSS 3
- TanStack Query v5
- Zustand (auth state)
- React Router v6

Backend:
- Node.js 20 LTS
- Express 4
- Prisma 5

Database:
- PostgreSQL 15 (AWS RDS)
- Prisma ORM
- AWS S3 (file attachments)

Authentication:
- JWT (httpOnly cookies)
- Refresh Tokens

Notifications:
- Firebase FCM (browser push)
- AWS SES via nodemailer (email)

API Documentation:
- Swagger UI at /api/docs

Deployment:
- AWS (ECS Fargate + RDS + S3 + CloudFront)

## Architecture

Follow Clean Architecture.

Backend layers:
- Controller (input validation + response)
- Service (business logic)
- Repository (Prisma DB access)
- Database (PostgreSQL)

Frontend layers:
- Pages (route-level views)
- Hooks (TanStack Query wrappers)
- Services (Axios API calls)
- Store (Zustand global state)

## Coding Standards

- TypeScript strict mode (`"strict": true` in tsconfig)
- No `any` types
- Explicit return types on all exported functions
- ESLint (eslint-config-airbnb-typescript) mandatory
- Prettier mandatory
- Husky + lint-staged pre-commit hooks
- Cyclomatic complexity ≤10; functions ≤50 lines; files ≤300 lines
- Use async/await

## Testing

- Backend: Jest + Supertest
- Frontend: Vitest + React Testing Library
- Minimum 80% line coverage
- 100% branch coverage on auth + ticket mutation paths
- Tests must pass in CI before merge

## API Standards

- REST APIs versioned under `/api/v1/`
- Uniform error envelope: `{ "error": { "code": string, "message": string } }`
- OpenAPI/Swagger documentation kept current
- All responses paginated with `{ data, meta }` shape

## Database

- Prisma ORM
- Soft delete on all entities (`deletedAt DateTime?`)
- Audit fields on all tables (`createdAt`, `updatedAt`)
- Composite indexes on ticket query patterns (see data-model.md)

## Naming Conventions

Controllers:
- `auth.controller.ts`, `ticket.controller.ts`

Services:
- `auth.service.ts`, `ticket.service.ts`

Repositories:
- `user.repository.ts`, `ticket.repository.ts`

## Roles

- ADMIN: full system access + configuration
- SUPPORT_MANAGER: team oversight, reports, manual escalation
- SUPPORT_AGENT: ticket management and resolution
- CUSTOMER: ticket submission and tracking (own tickets only)
<!-- SPECKIT END -->
