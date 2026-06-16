# Data Model: ServiceDesk CRM

**Phase**: 1 — Design
**Date**: 2026-06-13

---

## Entity Relationship Overview

```text
User ──────────────── Customer (1:1, optional)
 │                       │
 │ (assignee)            │ (owner)
 ▼                       ▼
Ticket ◄────────── SlaPolicy (N:1)
 │  │
 │  ├── Comment ──── Attachment
 │  ├── Attachment (direct ticket attachment)
 │  ├── EscalationEvent
 │  ├── Notification
 │  └── AuditLog
 │
User (createdBy, assignee, escalatedBy, escalatedTo)
RefreshToken, PasswordReset ──► User
```

---

## Ticket Status State Machine

```text
                ┌──────────────────────────────────────┐
                │                                      │
       [Submit] │                                      │ [Reopen within 7d]
                ▼                                      │
            OPEN ──► IN_PROGRESS ──► PENDING ──► RESOLVED ──► CLOSED
              │           │                               (auto after 7d)
              │    [Claim / Assign]
              │
              └──► IN_PROGRESS (auto-assign)

SLA Status (independent overlay):
  null (on track) ──► WARNING (≥80% elapsed) ──► BREACHED (100% elapsed)
  SLA status resets to null when ticket is RESOLVED.
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ──────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  SUPPORT_MANAGER
  SUPPORT_AGENT
  CUSTOMER
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  PENDING
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SlaStatus {
  WARNING
  BREACHED
}

enum CommentVisibility {
  PUBLIC
  INTERNAL
}

enum EscalationType {
  AUTO
  MANUAL
}

enum NotificationChannel {
  EMAIL
  IN_APP
}

enum NotificationEvent {
  TICKET_CREATED
  TICKET_ASSIGNED
  TICKET_STATUS_CHANGED
  TICKET_REPLY
  TICKET_RESOLVED
  SLA_WARNING
  SLA_BREACHED
  TICKET_ESCALATED
  AGENT_INVITED
  PASSWORD_RESET
  CSAT_REQUEST
}

// ─── Models ─────────────────────────────────────────────────────────────────

model User {
  id                  String    @id @default(uuid())
  name                String
  email               String    @unique
  passwordHash        String
  role                Role
  isActive            Boolean   @default(true)
  isAvailable         Boolean   @default(true)   // agent availability for assignment
  lastLoginAt         DateTime?
  invitationToken     String?   @unique
  invitationExpiresAt DateTime?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  customerProfile     Customer?
  refreshTokens       RefreshToken[]
  passwordResets      PasswordReset[]
  assignedTickets     Ticket[]           @relation("AssignedAgent")
  createdTickets      Ticket[]           @relation("TicketCreator")
  comments            Comment[]
  uploadedAttachments Attachment[]
  escalationsBy       EscalationEvent[]  @relation("EscalatedByUser")
  escalationsTo       EscalationEvent[]  @relation("EscalatedToUser")
  notifications       Notification[]
  auditLogs           AuditLog[]

  @@index([role, isActive])
  @@index([role, isActive, isAvailable])   // agent assignment lookup
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
}

model PasswordReset {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  isUsed    Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}

model Customer {
  id             String    @id @default(uuid())
  companyName    String?
  primaryContact String
  phone          String?
  tier           String    @default("standard")
  userId         String    @unique
  user           User      @relation(fields: [userId], references: [id])
  tickets        Ticket[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tickets   Ticket[]
}

model SlaPolicy {
  id                   String         @id @default(uuid())
  name                 String
  priority             TicketPriority @unique   // one policy per priority level
  maxResponseMinutes   Int
  maxResolutionMinutes Int
  businessHoursOnly    Boolean        @default(false)
  warningThreshold     Float          @default(0.8)   // 80%
  isActive             Boolean        @default(true)
  createdAt            DateTime       @default(now())
  updatedAt            DateTime       @updatedAt
  tickets              Ticket[]
}

model Ticket {
  id               String         @id @default(uuid())
  referenceNumber  String         @unique     // e.g. "SD-00001"
  title            String
  description      String         @db.Text
  status           TicketStatus   @default(OPEN)
  priority         TicketPriority
  slaStatus        SlaStatus?     // null = on track

  categoryId       String
  category         Category       @relation(fields: [categoryId], references: [id])

  customerId       String
  customer         Customer       @relation(fields: [customerId], references: [id])

  createdById      String
  createdBy        User           @relation("TicketCreator", fields: [createdById], references: [id])

  assigneeId       String?
  assignee         User?          @relation("AssignedAgent", fields: [assigneeId], references: [id])

  slaPolicyId      String?
  slaPolicy        SlaPolicy?     @relation(fields: [slaPolicyId], references: [id])

  // SLA timestamps — snapshotted at creation; compared by the cron job
  slaResponseDue   DateTime?
  slaResolutionDue DateTime?
  firstResponseAt  DateTime?      // set on first PUBLIC comment by agent
  resolvedAt       DateTime?

  // CSAT
  csatScore           Int?         // 1–5
  csatComment         String?
  csatSubmittedAt     DateTime?
  csatWindowExpiresAt DateTime?    // resolvedAt + 7 days

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  deletedAt        DateTime?

  comments         Comment[]
  attachments      Attachment[]
  escalations      EscalationEvent[]
  notifications    Notification[]
  auditLogs        AuditLog[]

  @@index([assigneeId, status])
  @@index([customerId, status])
  @@index([status, priority])
  @@index([slaResponseDue])
  @@index([slaResolutionDue])
  @@index([createdAt])
  @@index([referenceNumber])
}

model Comment {
  id          String            @id @default(uuid())
  content     String            @db.Text
  visibility  CommentVisibility @default(PUBLIC)

  ticketId    String
  ticket      Ticket            @relation(fields: [ticketId], references: [id])

  authorId    String
  author      User              @relation(fields: [authorId], references: [id])

  attachments Attachment[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  deletedAt   DateTime?

  @@index([ticketId, createdAt])
}

model Attachment {
  id           String   @id @default(uuid())
  fileName     String
  fileSize     Int      // bytes
  mimeType     String
  storageKey   String   // AWS S3 object key

  ticketId     String?
  ticket       Ticket?  @relation(fields: [ticketId], references: [id])

  commentId    String?
  comment      Comment? @relation(fields: [commentId], references: [id])

  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])

  createdAt    DateTime @default(now())

  @@index([ticketId])
  @@index([commentId])
}

model EscalationEvent {
  id            String         @id @default(uuid())
  type          EscalationType
  reason        String

  ticketId      String
  ticket        Ticket         @relation(fields: [ticketId], references: [id])

  escalatedById String?        // null for AUTO escalations (system-triggered)
  escalatedBy   User?          @relation("EscalatedByUser", fields: [escalatedById], references: [id])

  escalatedToId String
  escalatedTo   User           @relation("EscalatedToUser", fields: [escalatedToId], references: [id])

  createdAt     DateTime       @default(now())

  @@index([ticketId])
  @@index([createdAt])
}

model Notification {
  id          String              @id @default(uuid())
  channel     NotificationChannel
  eventType   NotificationEvent
  payload     Json
  isRead      Boolean             @default(false)
  isDelivered Boolean             @default(false)
  sentAt      DateTime?
  readAt      DateTime?

  recipientId String
  recipient   User                @relation(fields: [recipientId], references: [id])

  ticketId    String?
  ticket      Ticket?             @relation(fields: [ticketId], references: [id])

  createdAt   DateTime            @default(now())

  @@index([recipientId, isRead])
  @@index([recipientId, createdAt])
}

model AuditLog {
  id          String   @id @default(uuid())
  fieldName   String
  oldValue    String?  @db.Text
  newValue    String?  @db.Text

  ticketId    String
  ticket      Ticket   @relation(fields: [ticketId], references: [id])

  changedById String
  changedBy   User     @relation(fields: [changedById], references: [id])

  changedAt   DateTime @default(now())

  @@index([ticketId, changedAt])
}

model BusinessHours {
  id         String   @id @default(uuid())
  dayOfWeek  Int      // 0 = Sunday … 6 = Saturday
  startTime  String   // "09:00" HH:mm
  endTime    String   // "17:00" HH:mm
  isActive   Boolean  @default(true)
  timezone   String   @default("UTC")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([dayOfWeek])
}

model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  description String?
  updatedAt   DateTime @updatedAt
}
```

---

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| User | email | Valid email format; unique across non-deleted users |
| User | passwordHash | bcrypt hash of password ≥8 chars, ≥1 uppercase, ≥1 digit |
| Ticket | title | 5–200 characters |
| Ticket | description | 10–5000 characters |
| Ticket | csatScore | Integer 1–5 inclusive |
| Comment | content | 1–10000 characters |
| Attachment | fileSize | ≤10 MB (10,485,760 bytes) |
| Attachment | mimeType | Allowlist: image/jpeg, image/png, image/gif, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain |
| SlaPolicy | maxResponseMinutes | Integer ≥1 |
| SlaPolicy | maxResolutionMinutes | Integer > maxResponseMinutes |
| SlaPolicy | warningThreshold | Float 0.5–0.95 |
| BusinessHours | dayOfWeek | Integer 0–6 |
| BusinessHours | startTime/endTime | HH:mm format; startTime < endTime |

---

## Seed Data (`prisma/seed.ts`)

- **Default Admin**: `admin@servicedesk.local` / `Admin@1234` (must change on first login)
- **Default Categories**: Technical, Billing, General, Feature Request
- **Default SLA Policies**:
  - LOW: response 480 min (8 h), resolution 2880 min (48 h), business hours
  - MEDIUM: response 240 min (4 h), resolution 1440 min (24 h), business hours
  - HIGH: response 60 min (1 h), resolution 480 min (8 h), business hours
  - CRITICAL: response 15 min, resolution 120 min (2 h), 24/7
- **Default Business Hours**: Mon–Fri 09:00–17:00 UTC

---

## Key Index Rationale

| Index | Query Pattern |
|-------|--------------|
| `(assigneeId, status)` | Agent queue: `WHERE assigneeId = ? AND status NOT IN (RESOLVED, CLOSED)` |
| `(customerId, status)` | Customer portal: `WHERE customerId = ? AND status != CLOSED` |
| `(slaResponseDue)`, `(slaResolutionDue)` | SLA cron job: `WHERE slaResponseDue < NOW() AND status = OPEN` |
| `(createdAt)` | Report aggregation: `WHERE createdAt BETWEEN ? AND ?` |
| `(recipientId, isRead)` | Notification bell: `WHERE recipientId = ? AND isRead = false` |
| `(role, isActive, isAvailable)` | Auto-assignment: `WHERE role = SUPPORT_AGENT AND isActive = true AND isAvailable = true` |
