# Quickstart & Validation Guide: ServiceDesk CRM

**Purpose**: Prove end-to-end feature correctness after implementation. Run these scenarios in order; each maps to a user story from the spec.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 LTS |
| PostgreSQL | 15 |
| npm | 10+ |
| AWS CLI | Configured with S3 + SES access |
| Firebase project | Service account key available |

Copy environment files and populate all required values:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

---

## Setup

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Run database migrations + seed
cd ../backend
npx prisma migrate deploy
npx prisma db seed

# 3. Start backend (port 4000)
npm run dev

# 4. Start frontend (port 5173) — new terminal
cd ../frontend
npm run dev
```

Seed creates:
- Admin: `admin@servicedesk.local` / `Admin@1234`
- Default SLA policies (LOW, MEDIUM, HIGH, CRITICAL)
- Default categories (Technical, Billing, General, Feature Request)

---

## Scenario 1 — Customer Registration & Ticket Submission (US1 — P1)

**Expected**: Customer can register, verify, submit a ticket, and see it in their portal.

1. Open `http://localhost:5173/register`
2. Register with a new email address
3. Check the inbox — click the verification link
4. Log in → redirected to "My Tickets" (empty state visible)
5. Click "New Ticket" → fill in title, description, priority: HIGH, category: Technical
6. Submit → ticket appears in "My Tickets" with status "Open" and a reference number (SD-0000X)
7. A confirmation email arrives within 2 minutes

**API verification**:
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@test.com","password":"TestP@ss1"}' \
  -c cookies.txt

curl http://localhost:4000/api/v1/tickets \
  -b cookies.txt
# Expect: { "data": [{ "referenceNumber": "SD-00001", "status": "OPEN" }] }
```

---

## Scenario 2 — Agent Queue & Ticket Resolution (US2 — P1)

**Expected**: Agent sees assigned ticket, claims unassigned tickets, adds replies, resolves.

1. Log in as the default admin, create a Support Agent via `Admin → User Management`
2. Log in as the new agent → opens "My Tickets Queue"
3. Navigate to "Unassigned Queue" → claim the ticket from Scenario 1
4. Ticket now appears in the agent's queue with SLA indicator
5. Add a public reply: "We are investigating this issue."
6. Customer (separate browser session) sees the notification bell badge update within 30 seconds
7. Agent sets status → "In Progress" → then "Resolved" with resolution summary
8. Customer receives resolution email + in-app notification
9. Customer sees "Rate your experience" CSAT widget on the ticket

---

## Scenario 3 — SLA Warning & Auto-Escalation (US3 — P2)

**Expected**: System detects SLA approach and breach, escalates automatically.

1. As Admin, create a test SLA policy: `priority: CRITICAL`, `maxResponseMinutes: 2`, `maxResolutionMinutes: 5`, `businessHoursOnly: false`
2. Submit a new ticket with priority CRITICAL as a customer
3. **After ~1.6 minutes** (80% of 2 min), verify:
   - Ticket has `slaStatus: WARNING` in `GET /api/v1/tickets/:id`
   - Agent and manager receive SLA_WARNING notification
4. **After ~2 minutes** (breach), verify:
   - `slaStatus: BREACHED`
   - Escalation event created: `GET /api/v1/tickets/:id/audit`
   - Manager receives SLA_BREACHED + TICKET_ESCALATED notification
   - Ticket priority raised to CRITICAL (already there in this case)

**API verification**:
```bash
curl http://localhost:4000/api/v1/tickets/TICKET_ID \
  -b cookies.txt
# Expect: { "slaStatus": "BREACHED" }

curl http://localhost:4000/api/v1/tickets/TICKET_ID/audit \
  -b manager-cookies.txt
# Expect: escalation event in audit log
```

---

## Scenario 4 — Admin Configuration (US4 — P2)

**Expected**: Admin can manage users and SLA policies.

1. Log in as Admin → navigate to `Admin → User Management`
2. Create a new Support Manager (invitation email sent) → accept invitation in inbox → set password → log in
3. Create a new Support Agent via the same flow
4. Log in as Admin → `Admin → SLA Policies` → edit MEDIUM policy: change `maxResponseMinutes` to 180
5. Submit a new ticket with priority MEDIUM → verify `slaResponseDue` = now + 180 minutes (business hours adjusted)
6. Deactivate the Support Agent → verify agent cannot log in
7. Verify agent's previously open tickets now appear unassigned in the Support Manager's queue

---

## Scenario 5 — Reporting Dashboard (US5 — P3)

**Expected**: Manager sees accurate metrics with working filters.

_Prerequisites_: At least 10 tickets in various states from Scenarios 1–4.

1. Log in as Support Manager → navigate to Dashboard
2. Verify the summary panel shows:
   - Non-zero values for total tickets, status breakdown, SLA compliance %
   - No blank/null values (all metrics display a value or "—" empty state)
3. Set date filter → "Last 7 days" → metrics update within 3 seconds
4. Select an agent in the filter → agent-specific panel shows their ticket count + CSAT
5. Scroll to Escalation Summary → verify the CRITICAL test ticket escalation from Scenario 3 appears

**API verification**:
```bash
curl "http://localhost:4000/api/v1/reports/overview?from=2026-06-01&to=2026-06-13" \
  -b manager-cookies.txt
# Expect: all numeric fields present, slaComplianceRate in 0-1 range

curl "http://localhost:4000/api/v1/reports/sla" \
  -b manager-cookies.txt
# Expect: currentlyBreached array contains the CRITICAL test ticket
```

---

## Test Suite

```bash
# Backend unit + integration tests
cd backend
npm test

# With coverage report
npm run test:coverage
# Expect: overall ≥80%, auth + ticket mutation branches = 100%

# Frontend tests
cd ../frontend
npm test
```

---

## Swagger UI

Full interactive API documentation available at:
```
http://localhost:4000/api/docs
```

All endpoint schemas, request bodies, and response envelopes are documented and match this contracts directory.

---

## Constitution Compliance Checks

```bash
# Lint + type-check both projects
cd backend && npm run lint && npm run type-check
cd ../frontend && npm run lint && npm run type-check

# Security audit
cd backend && npm audit --audit-level=high
cd ../frontend && npm audit --audit-level=high

# Accessibility (run in frontend after build)
npm run build && npm run a11y-check
```

All checks must pass with zero errors before the feature is considered complete.
