---
description: "Task list for ServiceDesk CRM full-stack implementation"
---

# Tasks: ServiceDesk CRM

**Input**: Design documents from `specs/001-servicedesk-crm/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Integration test tasks included for auth and ticket mutation paths (100% branch coverage required per constitution Principle VI).

**Organization**: Tasks grouped by user story — each story phase is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable — operates on different files, no incomplete dependencies
- **[Story]**: Maps to user story (US1–US5) from spec.md
- All descriptions include exact file paths

## Path Conventions

- Backend source: `backend/src/`
- Frontend source: `frontend/src/`
- Tests: `backend/tests/`, `frontend/tests/`
- Prisma: `backend/prisma/`

---

## Phase 1: Setup

**Purpose**: Initialize both projects with tooling, linting, and test frameworks.

- [ ] T001 Initialize backend project structure: `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`, and `backend/src/` directory tree per plan.md
- [ ] T002 [P] Initialize frontend project with Vite + React 18 + TypeScript + Tailwind CSS in `frontend/` (`npm create vite@latest`, install Tailwind, configure `frontend/tailwind.config.ts` and `frontend/vite.config.ts`)
- [ ] T003 [P] Configure ESLint (eslint-config-airbnb-typescript) + Prettier in `backend/` — add `.eslintrc.js`, `.prettierrc`, and `lint` + `lint:fix` scripts to `backend/package.json`
- [ ] T004 [P] Configure ESLint + Prettier in `frontend/` — add `.eslintrc.js`, `.prettierrc`, and `lint` + `lint:fix` scripts to `frontend/package.json`
- [ ] T005 [P] Configure Husky + lint-staged pre-commit hooks in `backend/` — run `eslint` + `prettier --check` on staged `.ts` files; add `prepare` script to `backend/package.json`
- [ ] T006 [P] Configure Husky + lint-staged pre-commit hooks in `frontend/` — run `eslint` + `prettier --check` on staged `.ts`/`.tsx` files; add `prepare` script to `frontend/package.json`
- [ ] T007 Configure Jest + Supertest test environment in `backend/` — create `backend/jest.config.ts` (ts-jest preset, coverage thresholds: 80% lines, 100% branches on `services/auth*` and `services/ticket*`), `backend/tests/setup.ts` (test DB connection, global teardown)
- [ ] T008 [P] Configure Vitest + React Testing Library in `frontend/` — create `frontend/vitest.config.ts` with jsdom environment, coverage threshold 80% lines, add `test` and `test:coverage` scripts to `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, auth infrastructure, notification providers, and shared utilities that ALL user story phases depend on.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T009 Run Prisma initial migration from `backend/` — `npx prisma migrate dev --name init` to generate `backend/prisma/migrations/0001_init/` from the existing `backend/prisma/schema.prisma`
- [ ] T010 Implement `backend/src/utils/reference-number.ts` — `generateReferenceNumber(lastNumber: number): string` that returns zero-padded `SD-XXXXX` format; use atomic DB counter via `SystemConfig` table key `ticket_counter`
- [ ] T011 Implement `backend/src/utils/business-hours.ts` — `calculateSlaDeadline(startTime: Date, durationMinutes: number, businessHoursOnly: boolean, schedule: BusinessHours[]): Date` using `date-fns` + `date-fns-tz`; correctly skips weekends and off-hours windows
- [ ] T012 [P] Implement `backend/src/utils/audit.ts` — `writeAuditLog(prisma, ticketId, changedById, field, oldValue, newValue): Promise<void>` helper that creates an `AuditLog` record; accepts a Prisma transaction client
- [ ] T013 [P] Implement `backend/src/utils/round-robin.ts` — `findLeastLoadedAgent(prisma): Promise<string | null>` — Prisma query returning active, available SUPPORT_AGENT with fewest non-closed assigned tickets; ties broken by `user.createdAt ASC`
- [ ] T014 Implement `backend/src/repositories/user.repository.ts` — `findById`, `findByEmail`, `create`, `update`, `softDelete`, `listWithFilters(role?, isActive?, page, limit)`, `countOpenAssignedTickets(userId)` using Prisma client from `config/database.ts`
- [ ] T015 [P] Implement `backend/src/repositories/notification.repository.ts` — `create`, `listByRecipient(userId, filters, page, limit)`, `countUnread(userId)`, `markAsRead(id, userId)`, `markAllRead(userId)` using Prisma
- [ ] T016 [P] Implement `backend/src/repositories/audit.repository.ts` — `createLog(data)`, `findByTicketId(ticketId)` returning `AuditLog[]` ordered by `changedAt ASC`
- [ ] T017 Implement `backend/src/services/auth.service.ts` — `register` (bcrypt hash cost 12, create User with CUSTOMER role, send verification email), `verifyEmail`, `login` (verify active + verified, compare hash, issue JWT access + refresh cookies), `refresh` (rotate refresh token), `logout` (revoke refresh token), `forgotPassword` (create PasswordReset, send email), `resetPassword` (validate token, update hash, mark used), `acceptInvitation` (validate invitationToken, set password, activate), `changePassword`
- [ ] T018 Implement `backend/src/controllers/auth.controller.ts` — replace all stubs: each method calls `auth.service`, sets/clears `accessToken` + `refreshToken` httpOnly cookies (`SameSite=Strict`, `Secure` in production), returns `UserDTO` (strip `passwordHash`)
- [ ] T019 Implement `backend/src/notifications/email.provider.ts` — nodemailer transporter using `@aws-sdk/client-ses`; `sendEmail(to: string, subject: string, html: string): Promise<void>`; HTML template strings for each `NotificationEvent` type in `backend/src/notifications/templates/`
- [ ] T020 [P] Implement `backend/src/notifications/push.provider.ts` — Firebase Admin SDK initialized from env vars; `sendPush(fcmToken: string, title: string, body: string): Promise<void>`; silently ignore `messaging/registration-token-not-registered` errors (stale tokens)
- [ ] T021 Implement `backend/src/services/notification.service.ts` — `dispatch(recipientId, eventType, payload, ticketId?)`: save IN_APP `Notification` record, fire email and push async (non-blocking); `markAsRead(id, userId)`, `markAllRead(userId)`, `getUnreadCount(userId)`, `list(userId, filters)`
- [ ] T022 Implement `backend/src/controllers/notification.controller.ts` — replace all stubs: `listNotifications`, `getUnreadCount`, `markAsRead`, `markAllRead`, `registerFcmToken` (upsert `FcmToken` record)

**Frontend infrastructure:**

- [ ] T023 Configure React Router in `frontend/src/App.tsx` — define public routes (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`), and role-gated `ProtectedRoute` component that reads Zustand auth store and redirects to `/login` if not authenticated; wrap authenticated pages in shared layout with `NotificationBell` header
- [ ] T024 [P] Implement `frontend/src/services/api.ts` — Axios instance: `baseURL = /api/v1`, `withCredentials: true`; response interceptor for 401 → call `POST /auth/refresh` once → retry original request → clear auth store + redirect to `/login` on second 401
- [ ] T025 [P] Implement `frontend/src/store/auth.store.ts` — Zustand store: `user: UserDTO | null`, `isAuthenticated: boolean`; `setUser(user)`, `clearUser()` actions; persist to `sessionStorage` via `zustand/middleware`
- [ ] T026 Implement `frontend/src/services/auth.service.ts` — `login(body)`, `register(body)`, `logout()`, `forgotPassword(body)`, `resetPassword(body)`, `verifyEmail(body)`, `acceptInvitation(body)` — all call Axios from `api.ts`; `login` additionally calls `getMe()` and stores user in auth store
- [ ] T027 Build `frontend/src/components/common/` — implement `Button.tsx` (variant: primary/secondary/danger, size: sm/md/lg, loading spinner state), `Input.tsx` (label, error message, ARIA), `Badge.tsx` (status/priority color mapping), `Modal.tsx` (focus trap, ESC to close, aria-modal), `Table.tsx` (sortable columns, loading Skeleton rows, EmptyState slot), `Spinner.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`; all WCAG 2.1 AA compliant with visible focus rings
- [ ] T028 Implement `frontend/src/hooks/useAuth.ts` — wraps Zustand store: exposes `user`, `isAuthenticated`, `hasRole(...roles)`, `login(body)` (calls service + setUser), `logout()` (calls service + clearUser + navigate to `/login`)
- [ ] T029 Build `frontend/src/pages/auth/LoginPage.tsx` — React Hook Form + Zod schema; email + password fields; on submit call `useAuth.login`; show Spinner on loading; show ErrorState on API error; links to `/register` and `/forgot-password`; redirect to role-appropriate home on success
- [ ] T030 [P] Build `frontend/src/pages/auth/RegisterPage.tsx` — name, email, password, confirm-password fields with Zod validation; on success show "Check your email to verify" screen; link back to `/login`
- [ ] T031 [P] Build `frontend/src/pages/auth/ForgotPasswordPage.tsx` — email input; on success show "Reset link sent" success message regardless of whether email exists (prevents enumeration); back to login link
- [ ] T032 [P] Build `frontend/src/pages/auth/ResetPasswordPage.tsx` — read `token` from URL query param; new password + confirm fields with Zod; on success redirect to `/login` with success toast

**Checkpoint**: Foundation complete — all user story phases can now begin.

---

## Phase 3: User Story 1 — Customer Ticket Submission & Tracking (Priority: P1) 🎯 MVP

**Goal**: Customers can register, verify, log in, submit tickets, view their ticket list, read the ticket thread, and receive in-app/email notifications.

**Independent Test**: Register a customer → verify email → log in → submit ticket (all fields) → ticket appears in "My Tickets" with status OPEN and reference number → agent adds public reply → customer sees notification bell update + reply in timeline.

### Backend — US1

- [ ] T033 [P] [US1] Implement `backend/src/repositories/ticket.repository.ts` — `create(data)`, `findById(id)`, `findByCustomerId(customerId, filters, page, limit)`, `listWithFilters(filters, page, limit, sortBy, sortOrder)`, `update(id, data)`, `softDelete(id)`, `countByAssignee(assigneeId, statuses)`
- [ ] T034 [P] [US1] Implement `backend/src/repositories/comment.repository.ts` — `create(data)`, `findByTicketId(ticketId, visibilityFilter, page, limit)` (PUBLIC only for customers), `findById(id)`, `softDelete(id)`
- [ ] T035 [P] [US1] Implement `backend/src/repositories/sla.repository.ts` — `findByPriority(priority)`, `listAll()`, `create(data)`, `update(id, data)`, `softDelete(id)`
- [ ] T036 [US1] Implement `backend/src/services/assignment.service.ts` — `autoAssign(priority, prisma): Promise<string | null>` calls `round-robin.ts` to find least-loaded agent; returns `assigneeId` or `null` if no agents available; when null, notify SUPPORT_MANAGER
- [ ] T037 [US1] Implement `backend/src/services/ticket.service.ts` (create + read) — `createTicket(creatorId, body)`: generate reference number, compute SLA deadlines via `business-hours.ts`, call `assignment.service.autoAssign`, create Ticket in DB, dispatch `TICKET_CREATED` + `TICKET_ASSIGNED` notifications; `getTicket(id, requestUser)`: RBAC — customers see own ticket only (throw 403 otherwise); `listTickets(requestUser, query)`: role-filter applied
- [ ] T038 [US1] Implement `backend/src/services/comment.service.ts` — `createComment(ticketId, authorId, body)`: enforce visibility (customers cannot create INTERNAL), set `firstResponseAt` on Ticket if first PUBLIC agent comment, write AuditLog entry, dispatch `TICKET_REPLY` notification to the other party; `listComments(ticketId, requestUser, query)`: filter to PUBLIC for CUSTOMER role; `deleteComment(commentId, requestorId)`: author-only, within 5-minute window
- [ ] T039 [US1] Update `backend/src/controllers/ticket.controller.ts` — implement `listTickets`, `createTicket`, `getTicket` (replace stubs with real service calls; map results to `TicketDTO`; paginated response with `meta`)
- [ ] T040 [US1] Update `backend/src/controllers/comment.controller.ts` — implement `listComments`, `createComment`, `deleteComment` (replace stubs; return `CommentDTO`; paginated list)
- [ ] T041 [P] [US1] Implement `backend/src/controllers/attachment.controller.ts` — `presignUpload`: validate file count limit (≤5 per ticket), call `@aws-sdk/s3-request-presigner` to generate PUT URL (5-min expiry, max-content-length condition), return `{ uploadUrl, storageKey, expiresIn }`; `confirmUpload`: create `Attachment` record in DB; `deleteAttachment`: delete S3 object + soft-delete DB record (uploader or Admin only)

### Frontend — US1

- [ ] T042 [P] [US1] Implement `frontend/src/services/ticket.service.ts` — `listTickets(params)`, `getTicket(id)`, `createTicket(body)`, `updateStatus(id, body)`, `claimTicket(id)`, `assignTicket(id, body)`, `escalateTicket(id, body)`, `submitCsat(id, body)`, `getAuditLog(id)` — all via `api.ts` Axios
- [ ] T043 [P] [US1] Implement `frontend/src/services/comment.service.ts` — `listComments(ticketId, page)`, `createComment(ticketId, body)`, `deleteComment(ticketId, commentId)`, `presignAttachment(ticketId, body)`, `confirmAttachment(ticketId, body)`
- [ ] T044 [US1] Implement `frontend/src/hooks/useTickets.ts` — TanStack Query hooks: `useTickets(query)` (refetchOnWindowFocus), `useTicket(id)`, `useCreateTicket()` (mutation + invalidate list), `useUpdateTicketStatus()` (mutation + invalidate detail), `useClaimTicket()` (mutation)
- [ ] T045 [US1] Implement `frontend/src/hooks/useNotifications.ts` — `useNotifications(query)`, `useUnreadCount()` (`refetchInterval: 30_000`), `useMarkAsRead()`, `useMarkAllRead()`, `useRegisterFcmToken()`
- [ ] T046 [P] [US1] Build `frontend/src/components/tickets/SlaIndicator.tsx` — colored pill badge: green (on track), amber (WARNING, pulse animation), red (BREACHED); text shows time remaining (formatDistanceToNow from `date-fns`) or "Breached Xm ago"; accepts `slaStatus`, `slaResponseDue`, `slaResolutionDue` props
- [ ] T047 [P] [US1] Build `frontend/src/components/tickets/TicketCard.tsx` — compact row layout: reference number, truncated title, status Badge, priority Badge, SlaIndicator, assignee avatar/name, `createdAt` relative time; accepts `ticket: TicketDTO` prop
- [ ] T048 [P] [US1] Build `frontend/src/components/tickets/TicketList.tsx` — reusable Table wrapper: columns configurable by role, sortable by `slaResponseDue`/`createdAt`/`priority`, filter bar (status multi-select, priority select, search input), pagination controls; loading Skeleton rows (5 rows), EmptyState ("No tickets found"), ErrorState with retry
- [ ] T049 [US1] Build `frontend/src/components/tickets/TicketForm.tsx` — React Hook Form + Zod: `title` Input (5–200 chars), `description` textarea (10–5000 chars, character counter), `priority` Select (LOW/MEDIUM/HIGH/CRITICAL), `category` Select (fetched from `GET /api/v1/categories`), file attachment area (drag-drop + click, max 5 files × 10 MB, shows upload progress); submit calls `useCreateTicket`
- [ ] T050 [US1] Build `frontend/src/pages/tickets/CreateTicketPage.tsx` — page wrapper for TicketForm; on mutation success navigate to `TicketDetailPage` with success toast; show ErrorState if submission fails
- [ ] T051 [US1] Build `frontend/src/pages/tickets/TicketListPage.tsx` — role-adaptive: CUSTOMER tab = "My Tickets" (customerId auto-applied); AGENT tabs = "My Queue" (sorted slaResponseDue ASC) + "Unassigned"; MANAGER/ADMIN = "All Tickets"; uses TicketList component; "New Ticket" button for customers; loading/empty/error states
- [ ] T052 [P] [US1] Build `frontend/src/components/tickets/CommentBox.tsx` — textarea (1–10000 chars), character count, INTERNAL/PUBLIC toggle (hidden for CUSTOMER role), file attachment picker (triggers presign → S3 upload → confirm flow), submit Button; disables while mutation pending
- [ ] T053 [P] [US1] Build `frontend/src/components/tickets/TicketTimeline.tsx` — chronological list of `CommentDTO` items; PUBLIC comments shown to all; INTERNAL notes shown only to agents/managers with "(Internal)" label; each item shows author avatar + name + role, content, timestamp (relative); attachment download links
- [ ] T054 [US1] Build `frontend/src/pages/tickets/TicketDetailPage.tsx` — ticket header card (referenceNumber, title, status Badge, priority Badge, SlaIndicator, assignee, category, createdAt); TicketTimeline below; CommentBox at bottom; CSAT widget (1–5 star rating + optional comment textarea) if status=RESOLVED and within window; "Reopen" button if within 7 days of resolution; shows `ErrorState` with "Access Denied" message if API returns 403
- [ ] T055 [P] [US1] Build `frontend/src/components/notifications/NotificationBell.tsx` + `NotificationList.tsx` — bell icon (Heroicons) with red badge showing `unreadCount` (hidden if 0); click toggles `NotificationList` dropdown; list shows 10 most recent notifications (eventType label, ticket referenceNumber, relative time, read/unread dot); "Mark all read" button; loading Skeleton; EmptyState ("No notifications")

**Checkpoint**: User Story 1 fully functional and independently testable. Customers can submit and track tickets end-to-end.

---

## Phase 4: User Story 2 — Agent Ticket Management & Resolution (Priority: P1)

**Goal**: Agents view their assigned queue sorted by SLA urgency, claim unassigned tickets, add public replies or internal notes, update status, and resolve tickets with a resolution summary.

**Independent Test**: Agent logs in → sees "My Queue" sorted by slaResponseDue → claims an unassigned ticket → adds internal note (not visible to customer) → adds public reply (customer notified) → resolves ticket with resolution note → customer receives TICKET_RESOLVED notification + CSAT prompt.

### Backend — US2

- [ ] T056 [US2] Extend `backend/src/services/ticket.service.ts` (mutations) — `updateStatus(ticketId, status, resolutionNote, actorId)`: validate state-machine transition (OPEN→IN_PROGRESS etc.), write AuditLog, dispatch `TICKET_STATUS_CHANGED` notification; `resolveTicket`: set `resolvedAt`, `csatWindowExpiresAt = resolvedAt + 7 days`, reset `slaStatus = null`, dispatch `TICKET_RESOLVED` + `CSAT_REQUEST` notifications; `claimTicket(ticketId, agentId)`: guard ticket is unassigned, set `assigneeId`, dispatch `TICKET_ASSIGNED` notification; `assignTicket(ticketId, assigneeId, actorId)`: manager/admin only, write AuditLog
- [ ] T057 [US2] Update `backend/src/controllers/ticket.controller.ts` — implement `updateStatus`, `claimTicket`, `assignTicket` (replace stubs; respond with updated `TicketDTO`)

### Frontend — US2

- [ ] T058 [P] [US2] Implement `frontend/src/services/user.service.ts` — `getMe()`, `getUser(id)`, `listUsers(params)`, `updateUser(id, body)`, `deactivateUser(id)`, `activateUser(id)`, `changePassword(body)` via `api.ts`
- [ ] T059 [US2] Extend `frontend/src/pages/tickets/TicketListPage.tsx` — agent "My Queue" tab: sort by `slaResponseDue ASC` default; "Unassigned" tab shows tickets with no assignee and a "Claim" button per row (calls `useClaimTicket`); optimistic update on claim removes ticket from unassigned list immediately
- [ ] T060 [US2] Extend `frontend/src/pages/tickets/TicketDetailPage.tsx` — agent/manager action panel (right sidebar): status Select (shows only valid transitions per current status), "Resolve" Button (opens Modal with required resolution note textarea, submit calls `updateStatus` with `RESOLVED`); "Assign" Button (manager/admin only, opens agent picker Modal); CommentBox shows INTERNAL visibility toggle for agents
- [ ] T061 [P] [US2] Build authenticated app layout in `frontend/src/layouts/AppLayout.tsx` — top nav (logo, NotificationBell, user menu with logout), role-based sidebar: CUSTOMER sidebar = "My Tickets" + "New Ticket"; AGENT/MANAGER sidebar = "My Queue", "Unassigned", "All Tickets"; ADMIN sidebar = all above + "Admin" section link
- [ ] T062 [P] [US2] Implement `frontend/src/utils/date.ts` — `formatSlaDeadline(iso: string): string`, `formatRelativeTime(iso: string): string`, `isSlaWarning(ticket: TicketDTO): boolean`, `isSlaBreached(ticket: TicketDTO): boolean`, `canReopenTicket(ticket: TicketDTO): boolean` (resolvedAt within 7 days), `isWithinCsatWindow(ticket: TicketDTO): boolean`

**Checkpoint**: User Stories 1 + 2 both independently functional. Full ticket lifecycle operational.

---

## Phase 5: User Story 3 — SLA Monitoring & Escalation (Priority: P2)

**Goal**: System auto-flags tickets at 80% SLA elapsed (WARNING) and auto-escalates on breach. Managers can also manually escalate. All SLA events notify relevant parties and create audit records.

**Independent Test**: Create ticket with CRITICAL priority (SLA: 15-min response); after 12 minutes → ticket shows WARNING + notifications sent; after 15 minutes → `slaStatus = BREACHED`, EscalationEvent created, manager notified. Manager opens ticket → manually escalates with reason → priority raised, agent notified.

### Backend — US3

- [ ] T063 [US3] Implement `backend/src/services/sla.service.ts` — `applySlaPolicyToTicket(ticket, policy, businessHours): { slaResponseDue, slaResolutionDue }` calls `business-hours.calculateSlaDeadline`; `evaluateTicket(ticket, now)`: compare `slaResponseDue`/`slaResolutionDue` vs `now`, determine new `slaStatus` (null/WARNING/BREACHED); if BREACHED and not already escalated → call `escalation.service.autoEscalate`; if WARNING and not already warned → dispatch `SLA_WARNING` notifications to assignee + manager; update ticket `slaStatus` in DB; `findTicketsNeedingEvaluation()`: Prisma query for active tickets where either SLA deadline is within warning window or is past
- [ ] T064 [US3] Implement `backend/src/services/escalation.service.ts` — `autoEscalate(ticket)`: create `EscalationEvent(AUTO, "Automatic SLA breach", escalatedToId=findRecipient)`, dispatch `SLA_BREACHED` + `TICKET_ESCALATED` notifications, write AuditLog; `manualEscalate(ticketId, reason, actorId)`: create `EscalationEvent(MANUAL, reason)`, raise priority one tier (if not CRITICAL), dispatch `TICKET_ESCALATED` notification to assignee, write AuditLog; `findEscalationRecipient(ticket)`: find active SUPPORT_MANAGER; fallback to ADMIN if none found
- [ ] T065 [US3] Implement `backend/src/jobs/sla-monitor.job.ts` — `node-cron` schedule `'*/1 * * * *'`; on each tick: call `slaService.findTicketsNeedingEvaluation()`, iterate results calling `slaService.evaluateTicket(ticket, new Date())`; wrap each evaluation in try-catch to prevent one bad ticket from stopping the job; export `startSlaMonitor()` function
- [ ] T066 [US3] Register SLA monitor in `backend/src/index.ts` — call `startSlaMonitor()` after server starts listening; log a startup message confirming the job is active
- [ ] T067 [US3] Update `backend/src/controllers/ticket.controller.ts` — implement `escalateTicket` (replace stub): validate actor is SUPPORT_MANAGER or ADMIN, call `escalationService.manualEscalate`, return updated ticket
- [ ] T068 [P] [US3] Extend `backend/src/services/ticket.service.ts` — wire `slaService.applySlaPolicyToTicket` into the `createTicket` flow: after SLA policy is loaded by priority, compute and set `slaResponseDue` and `slaResolutionDue` on the new Ticket

### Frontend — US3

- [ ] T069 [P] [US3] Extend `frontend/src/components/tickets/SlaIndicator.tsx` — add CSS pulse animation (`animate-pulse`) on WARNING state; display "Breached X ago" (formatRelativeTime) on BREACHED state; use amber Tailwind colors for WARNING, red for BREACHED
- [ ] T070 [US3] Add manual escalation modal to `frontend/src/pages/tickets/TicketDetailPage.tsx` — "Escalate" button visible only to SUPPORT_MANAGER + ADMIN; opens Modal with required `reason` textarea (10–500 chars); on submit calls `useEscalateTicket` mutation; invalidates `useTicket` query on success
- [ ] T071 [P] [US3] Extend `frontend/src/pages/tickets/TicketListPage.tsx` — add "SLA Warning" and "SLA Breached" filter tabs (apply `slaStatus` query param); highlight WARNING rows with amber left border, BREACHED rows with red left border using Tailwind `border-l-4`

**Checkpoint**: SLA monitoring active. Tickets auto-escalate. Managers can manually escalate. All SLA events trigger notifications.

---

## Phase 6: User Story 4 — Team & Customer Administration (Priority: P2)

**Goal**: Admin creates/deactivates agents and customer accounts, defines SLA policies, configures categories and business hours. Deactivation revokes sessions and flags open tickets for reassignment.

**Independent Test**: Admin creates agent (invite email sent) → agent accepts invitation and sets password → agent logs in successfully → admin deactivates agent → agent cannot log in → agent's open tickets flagged unassigned → manager notified.

### Backend — US4

- [ ] T072 [US4] Implement `backend/src/repositories/customer.repository.ts` — `create(data)`, `findById(id)`, `findByUserId(userId)`, `listWithFilters(tier?, search?, page, limit)`, `update(id, data)`, `softDelete(id)`
- [ ] T073 [US4] Update `backend/src/controllers/user.controller.ts` — implement all handlers (replace stubs): `listUsers` (paginated, role/isActive filter), `createUser` (create User record + send invitation email via `auth.service.sendInvitation`), `getMe`, `changePassword`, `getUser`, `updateUser`, `deactivateUser` (revoke all RefreshTokens, set `isActive=false`, re-queue open assigned tickets as unassigned, notify SUPPORT_MANAGER), `activateUser`
- [ ] T074 [P] [US4] Update `backend/src/controllers/customer.controller.ts` — implement `listCustomers`, `createCustomer` (create User with CUSTOMER role + Customer profile + send invitation email), `getCustomer`, `updateCustomer` (replace stubs)
- [ ] T075 [P] [US4] Update `backend/src/controllers/category.controller.ts` — implement `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` (guard: return 409 if category has active tickets) (replace stubs)
- [ ] T076 [P] [US4] Update `backend/src/controllers/sla.controller.ts` — implement `listSlaPolicies`, `createSlaPolicy`, `updateSlaPolicy` (note in response that existing tickets are unaffected), `deleteSlaPolicy` (guard: return 409 if it is the active policy for its priority) (replace stubs)
- [ ] T077 [P] [US4] Update `backend/src/controllers/config.controller.ts` — implement `getBusinessHours` (read all `BusinessHours` rows + `SystemConfig` timezone key), `updateBusinessHours` (upsert 7 rows, update timezone config) (replace stubs)
- [ ] T078 [US4] Extend `backend/src/services/auth.service.ts` — `sendInvitation(userId)`: generate UUID `invitationToken`, set `invitationExpiresAt = now + 48h`, update User, send `AGENT_INVITED` email with accept-invitation link `${FRONTEND_URL}/accept-invitation?token=xxx`; `deactivateUser` side-effect helper: deleteMany RefreshTokens for userId, update open Tickets to `assigneeId=null`, notify managers

### Frontend — US4

- [x] T079 [US4] Build `frontend/src/pages/admin/UserManagementPage.tsx` — Table of users (name, email, role Badge, status Badge, lastLoginAt); role filter Select; search Input; "Invite Agent" Button opens Modal with name + email + role Select → calls `createUser` mutation; activate/deactivate toggle per row; loading Skeleton, EmptyState, ErrorState
- [x] T080 [P] [US4] Build `frontend/src/pages/admin/SLAManagementPage.tsx` — Table showing one row per TicketPriority (LOW/MEDIUM/HIGH/CRITICAL); inline edit: `maxResponseMinutes` number Input, `maxResolutionMinutes` number Input, `businessHoursOnly` toggle, `warningThreshold` number Input; save/cancel Buttons; warns "Changes apply to new tickets only"; validation (resolution > response)
- [x] T081 [P] [US4] Build `frontend/src/pages/admin/CategoryManagementPage.tsx` — list of categories with name, active status toggle; inline "Add category" Input row; rename on row click; deactivate toggle (disabled with tooltip if category has active tickets)
- [x] T082 [P] [US4] Build `frontend/src/pages/admin/BusinessHoursPage.tsx` — 7-row table (day label, start time Input, end time Input, active toggle); timezone Select; Save Button; shows current effective schedule; validation per row
- [x] T083 [US4] Build admin navigation section in `frontend/src/layouts/AppLayout.tsx` — sidebar section visible only to ADMIN role: "Users", "SLA Policies", "Categories", "Business Hours" links with active route highlighting

**Checkpoint**: Full administration operational. Agents can be onboarded and offboarded. SLA policies and categories are configurable.

---

## Phase 7: User Story 5 — Performance Reporting Dashboard (Priority: P3)

**Goal**: Support Manager views ticket volume trends, SLA compliance rates, agent performance, and escalation counts — all filterable by date range, agent, and category. Dashboard renders within 3 seconds.

**Independent Test**: With ≥10 tickets across statuses/agents in DB — manager opens ReportingDashboardPage → summary StatCards show non-zero values → apply "Last 30 days" filter → all widgets update within 3 seconds → agent filter → AgentPerformanceTable shows single agent's metrics.

### Backend — US5

- [ ] T084 [US5] Implement `backend/src/services/report.service.ts` — `getOverview(filters)`: Prisma aggregate queries for `totalTickets`, `ticketsByStatus` (groupBy status count), `slaComplianceRate` (tickets where resolvedAt ≤ slaResolutionDue / total resolved), `avgFirstResponseMinutes`, `avgResolutionMinutes`, `openTickets`, `avgCsatScore`; all filtered by `from`, `to`, `agentId`, `categoryId`
- [ ] T085 [P] [US5] Extend `backend/src/services/report.service.ts` — `getTicketSeries(filters, groupBy)`: use `prisma.$queryRaw` with `date_trunc` for daily/weekly created + resolved + breached counts; `getAgentMetrics(filters)`: per-agent aggregation (ticketsHandled, avgFirstResponseMinutes, avgResolutionMinutes, slaComplianceRate, avgCsatScore); `getSlaReport(filters)`: compliance by priority + currentlyBreached list; `getEscalationReport(filters)`: total, byType counts, topReasons (groupBy reason count DESC), recentEscalations
- [ ] T086 [US5] Implement `backend/src/controllers/report.controller.ts` — replace all stubs: `getOverview`, `getTicketReport`, `getAgentReport`, `getSlaReport`, `getEscalationReport` each parse query via `ReportQuery`/`TicketReportQuery` schema, call report service, return JSON

### Frontend — US5

- [ ] T087 [P] [US5] Implement `frontend/src/services/report.service.ts` — `getOverview(params)`, `getTicketReport(params)`, `getAgentReport(params)`, `getSlaReport(params)`, `getEscalationReport(params)` via `api.ts`
- [ ] T088 [US5] Implement `frontend/src/hooks/useReports.ts` — `useOverview(params)`, `useTicketSeries(params)`, `useAgentMetrics(params)`, `useSlaReport(params)`, `useEscalationReport(params)`; all TanStack Query with `staleTime: 60_000`; params include `from`, `to`, `agentId`, `categoryId`
- [ ] T089 [P] [US5] Build `frontend/src/components/dashboard/StatCard.tsx` — KPI card: large bold value, label text, optional trend arrow (↑/↓) with percentage change vs prior period; loading Skeleton variant (pulse animation); accessible with `aria-label`
- [ ] T090 [P] [US5] Build `frontend/src/components/dashboard/TicketTrendChart.tsx` — Recharts `AreaChart` (lazy-loaded with `React.lazy`): two series (created blue, resolved green); ResponsiveContainer; X-axis dates; tooltips; loading Skeleton fallback; EmptyState if no data
- [ ] T091 [P] [US5] Build `frontend/src/components/dashboard/SlaComplianceChart.tsx` — Recharts `RadialBarChart`: one bar per priority, color-coded (green ≥90%, amber 70–90%, red <70%); compliance % label in center; loading Skeleton; EmptyState
- [ ] T092 [P] [US5] Build `frontend/src/components/dashboard/AgentPerformanceTable.tsx` — Table (sortable): columns = agent name, ticketsHandled, avgResponseTime (formatted), resolutionRate %, avgCsatScore (star display), escalationCount; loading Skeleton rows; EmptyState
- [ ] T093 [US5] Build `frontend/src/pages/dashboard/ReportingDashboardPage.tsx` — filter bar: date range picker (`from`/`to` date inputs), agent Select (fetched from `GET /api/v1/users?role=SUPPORT_AGENT`), category Select; StatCards row (4 KPIs); 2-column: TicketTrendChart (full width) then SlaComplianceChart + AgentPerformanceTable side-by-side; EscalationSummary section (total, byType, recentEscalations table); all sections show loading Skeleton, EmptyState, ErrorState independently

**Checkpoint**: All 5 user stories complete. Full-system functionality operational.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Constitution-compliance verification, security hardening, performance validation, accessibility audit, and coverage gates.

- [ ] T094 [P] Security hardening — run `npm audit --audit-level=high` in `backend/` and `frontend/`; review Helmet.js CSP configuration in `backend/src/config/app.ts` (add `script-src`, `style-src`, `img-src` directives); verify `express-rate-limit` covers `/auth/login`, `/auth/register`, `/auth/forgot-password`; confirm no secrets committed via `git log --all -S "password"` scan
- [ ] T095 Performance benchmarking — run `backend/tests/performance/ticket-api.bench.ts` using Supertest with 50 concurrent requests to `GET /api/v1/tickets` and `POST /api/v1/tickets`; verify p95 response time ≤200ms; run `npx lighthouse` on TicketListPage and ReportingDashboardPage; document results in `specs/001-servicedesk-crm/quickstart.md`
- [ ] T096 [P] Accessibility audit — run `axe-core` via `frontend/tests/accessibility/` against LoginPage, TicketListPage, TicketDetailPage, and ReportingDashboardPage; fix all WCAG 2.1 AA violations; verify keyboard navigation (Tab, Enter, ESC) on Modal, Table, NotificationList; verify all form fields have associated labels
- [ ] T097 [P] OpenAPI spec sync — verify all 55 endpoints render correctly at `http://localhost:4000/api/docs`; add missing `@swagger` JSDoc annotations to any route files; confirm request bodies, response schemas, and error responses match contracts in `specs/001-servicedesk-crm/contracts/`
- [ ] T098 Backend coverage gate — run `npm run test:coverage` in `backend/`; verify ≥80% overall line coverage; verify 100% branch coverage in `backend/src/services/auth.service.ts` and `backend/src/services/ticket.service.ts`; fail build if thresholds not met
- [ ] T099 [P] Frontend coverage gate — run `npm run test:coverage` in `frontend/`; verify ≥80% line coverage on `frontend/src/hooks/` and `frontend/src/services/`; fix any failing tests
- [ ] T100 [P] Add `backend/tests/integration/auth.test.ts` — Supertest integration tests against test DB: `POST /auth/register` (valid, duplicate email), `POST /auth/verify-email` (valid, expired token), `POST /auth/login` (valid, wrong password, unverified account, deactivated account), `POST /auth/refresh` (valid, revoked token), `POST /auth/logout`
- [ ] T101 [P] Add `backend/tests/integration/ticket.test.ts` — Supertest integration tests: `POST /tickets` (customer creates, auto-assignment verified), `PATCH /tickets/:id/status` (all valid transitions, invalid transition returns 400), `PATCH /tickets/:id/assign` (manager only, agent cannot), `POST /tickets/:id/escalate` (manager only), `POST /tickets/:id/csat` (customer only, within window, after window)
- [ ] T102 Code cleanup — run `npm run lint` in both projects; ensure all functions ≤50 lines (`eslint-plugin-max-len`), files ≤300 lines; cyclomatic complexity ≤10 (`eslint complexity` rule); remove all stub `501 NOT_IMPLEMENTED` responses (replace with real implementations or throw `AppError(404)` for unimplemented optional features)
- [ ] T103 Run quickstart validation — follow all 5 scenarios in `specs/001-servicedesk-crm/quickstart.md` against the running application (backend on :4000, frontend on :5173); document PASS/FAIL for each scenario; all 5 must PASS before the feature is marked complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 completion — BLOCKS all user story phases
- **Phase 3 (US1 — P1)**: Requires Phase 2 — first deliverable MVP
- **Phase 4 (US2 — P1)**: Requires Phase 3 (agent flow extends ticket + comment services)
- **Phase 5 (US3 — P2)**: Requires Phase 3 (SLA cron monitors tickets created in US1)
- **Phase 6 (US4 — P2)**: Requires Phase 2; can run in parallel with US3
- **Phase 7 (US5 — P3)**: Requires all preceding phases (aggregates data from all stories)
- **Phase N (Polish)**: Requires all user story phases complete

### User Story Dependencies

- **US1 (P1)**: Requires Foundational — no dependency on other stories
- **US2 (P1)**: Requires US1 (extends ticket service + detail page)
- **US3 (P2)**: Requires US1 (monitors tickets) — independent of US2
- **US4 (P2)**: Requires Foundational — independent of US1/US2/US3
- **US5 (P3)**: Requires US1–US4 complete (aggregates cross-story data)

### Within Each Story

- Repositories → Services → Controllers (backend)
- Services → Hooks → Components → Pages (frontend)
- Backend API must be functional before frontend integration

---

## Parallel Execution Examples

### Phase 2 Foundational — parallelizable at startup

```bash
# These can run concurrently (different files):
T010  backend/src/utils/reference-number.ts
T011  backend/src/utils/business-hours.ts
T012  backend/src/utils/audit.ts
T013  backend/src/utils/round-robin.ts
T015  backend/src/repositories/notification.repository.ts
T016  backend/src/repositories/audit.repository.ts
T019  backend/src/notifications/email.provider.ts
T020  backend/src/notifications/push.provider.ts
T024  frontend/src/services/api.ts
T025  frontend/src/store/auth.store.ts
```

### Phase 3 (US1) — parallelizable after T036

```bash
# After Assignment + SLA services are implemented:
T033  backend: ticket.repository.ts
T034  backend: comment.repository.ts
T035  backend: sla.repository.ts
T041  backend: attachment.controller.ts
T042  frontend: ticket.service.ts
T043  frontend: comment.service.ts
T046  frontend: SlaIndicator.tsx
T047  frontend: TicketCard.tsx
T048  frontend: TicketList.tsx
```

### Phase 6 (US4) — admin controllers are fully independent

```bash
T073  user.controller.ts (implement)
T074  customer.controller.ts (implement)
T075  category.controller.ts (implement)
T076  sla.controller.ts (implement)
T077  config.controller.ts (implement)
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 only — P1)

1. Complete Phase 1 + Phase 2 (T001–T032)
2. Complete Phase 3 — US1 (T033–T055)
3. **STOP and VALIDATE**: Customer can register, submit a ticket, view it, receive notifications
4. Complete Phase 4 — US2 (T056–T062)
5. **STOP and VALIDATE**: Agent can view queue, claim ticket, reply, resolve — full lifecycle works
6. Deploy MVP to AWS

### Incremental Delivery

1. MVP (US1 + US2) → Deploy → Demo
2. Add US3 (SLA + Escalation) → Deploy → SLA compliance visible
3. Add US4 (Admin) → Deploy → Full team management operational
4. Add US5 (Reporting) → Deploy → Management insights available
5. Polish phase → Production-ready release

### Parallel Team Strategy (with 3 developers)

After Phase 2 completes:
- **Developer A**: US1 backend (T033–T041) → US2 backend (T056–T057) → US3 (T063–T068)
- **Developer B**: US1 frontend (T042–T055) → US2 frontend (T058–T062) → US5 (T087–T093)
- **Developer C**: US4 all (T072–T083) → US5 backend (T084–T086) → Polish (T094–T103)

---

## Notes

- `[P]` tasks operate on different files — safe to run in parallel with other `[P]` tasks in the same phase
- `[US#]` label maps each task to a specific user story for traceability to spec.md
- Each user story phase ends with a **Checkpoint** — validate the story independently before proceeding
- Tests in T100–T101 must use a separate test database (set `DATABASE_URL` to a test DB in `backend/tests/setup.ts`)
- Avoid: vague task descriptions, tasks without file paths, cross-story dependencies that break phase independence
