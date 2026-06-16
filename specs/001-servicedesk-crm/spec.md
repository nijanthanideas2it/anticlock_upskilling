# Feature Specification: ServiceDesk CRM

**Feature Branch**: `001-servicedesk-crm`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "Build a ServiceDesk CRM application that allows organizations to manage customers, support tickets, agents, SLAs, escalations, and reporting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Customer Ticket Submission & Tracking (Priority: P1)

A customer logs into the portal, submits a support request with relevant details (subject, description, priority, category, and optional attachments), and tracks the ticket's progress — receiving notifications when the status changes, when an agent replies, or when the ticket is resolved. The customer can reply to agent messages and reopen a recently closed ticket.

**Why this priority**: This is the core intake mechanism for the entire system. Without ticket submission, nothing else exists. It delivers direct, immediate value to customers and is the foundation every other feature depends on.

**Independent Test**: A customer can register, verify their email, log in, submit a ticket with all fields, receive a confirmation notification, view the ticket in "My Tickets", and see an agent's reply — fully verifiable without SLA, escalation, or reporting features being in place.

**Acceptance Scenarios**:

1. **Given** a registered and verified customer, **When** they submit a ticket with a title, description, priority (Low/Medium/High/Critical), and category, **Then** the ticket is created with a unique reference ID, a confirmation notification is sent to the customer, and the ticket appears in their "My Tickets" list with status "Open".
2. **Given** an active ticket, **When** an agent posts a public reply, **Then** the customer receives a notification and can view the reply in the ticket thread in chronological order.
3. **Given** a resolved ticket, **When** the customer views it, **Then** they see the resolution note, can rate their support experience (1–5 stars with optional comment), and can reopen the ticket within 7 days of resolution.
4. **Given** a customer, **When** they try to access another customer's ticket URL directly, **Then** they receive an "Access Denied" response and are not shown any data from that ticket.

---

### User Story 2 - Agent Ticket Management & Resolution (Priority: P1)

A support agent logs in, views their assigned ticket queue sorted by SLA urgency, claims unassigned tickets, adds public replies or internal notes, updates ticket status through its lifecycle, and marks tickets as resolved with a resolution summary.

**Why this priority**: Agents are the primary operators who drive ticket throughput and customer outcomes. The system cannot fulfil its support function without agents being able to manage and resolve tickets.

**Independent Test**: An agent can log in, view their queue sorted by urgency, add a comment to a ticket, change its status to "In Progress", add an internal note invisible to the customer, and mark it "Resolved" — all verifiable without SLA or escalation features present.

**Acceptance Scenarios**:

1. **Given** a logged-in agent, **When** they open their queue, **Then** they see tickets assigned to them sorted by SLA deadline (most urgent first), with visual indicators for SLA Warning and SLA Breached tickets.
2. **Given** an unassigned ticket in the shared queue, **When** the agent claims it, **Then** the ticket is assigned to them, removed from the unassigned pool, and the customer is notified that an agent has been assigned.
3. **Given** an open ticket assigned to the agent, **When** they add a public reply, **Then** the reply is recorded in the ticket timeline and the customer is notified; **When** they add an internal note, **Then** the note is visible only to agents and managers.
4. **Given** an open ticket, **When** the agent marks it "Resolved" with a required resolution summary, **Then** the ticket status changes to "Resolved", the SLA timer stops, and the customer receives a resolution notification with the summary.

---

### User Story 3 - SLA Monitoring & Escalation (Priority: P2)

The system continuously monitors each ticket's elapsed time against the SLA policy for its priority. When 80% of the response or resolution time elapses, the ticket is flagged with a warning. When the threshold is breached, the ticket is automatically escalated — updating its urgency, notifying the assigned agent and support manager, and recording the escalation event. Managers can also manually escalate tickets at any time.

**Why this priority**: SLA tracking differentiates this from a basic ticketing system and ensures service commitments are honoured. However, the core ticket flow (P1) must work independently first; SLA adds the compliance and visibility layer.

**Independent Test**: Create a ticket with an SLA policy set to 2-minute response time. After 1.6 minutes with no agent response, observe the ticket flagged "SLA Warning" and the agent notified. After 2 minutes, observe the ticket marked "SLA Breached", automatically escalated, and the support manager notified — verifiable without the reporting dashboard.

**Acceptance Scenarios**:

1. **Given** a ticket with an active SLA policy, **When** 80% of the first-response time elapses without an agent reply, **Then** the ticket is flagged "SLA Warning" and both the assigned agent and the support manager receive a notification.
2. **Given** a ticket that exceeds its first-response SLA deadline, **When** the breach occurs, **Then** the ticket is marked "SLA Breached", automatically escalated to the support manager, the escalation event is logged with a timestamp, and all parties are notified.
3. **Given** a support manager, **When** they manually escalate a ticket by selecting a reason from a predefined list, **Then** the escalation is recorded with the reason, the ticket's priority is raised by one level (if not already Critical), and the assigned agent is notified.
4. **Given** a ticket assigned to a deactivated agent, **When** an SLA breach occurs, **Then** the ticket is escalated and flagged for reassignment, and the support manager is notified.

---

### User Story 4 - Team & Customer Administration (Priority: P2)

An admin manages the organization's support operation: creating and deactivating agent accounts, managing customer accounts, defining SLA policies per priority tier, configuring escalation rules, and setting up ticket categories and notification templates.

**Why this priority**: Configuration is required before the system can be tailored to an organization, but reasonable defaults allow the core ticket flow to operate, making this P2.

**Independent Test**: An admin can create a new agent account (agent receives invitation email and sets password), define an SLA policy (Critical = 1 hr response / 4 hr resolution), and deactivate a departing agent whose open tickets are then flagged for reassignment — independently verifiable without reporting.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they create a new agent with name, email, and role, **Then** the agent receives an invitation email, can set their own password via a secure link, and appears in the active team roster.
2. **Given** an admin, **When** they define an SLA policy with response and resolution targets per priority level and optionally restrict it to business hours, **Then** the policy is available for assignment and is automatically applied to tickets matching the configured priority.
3. **Given** an admin, **When** they deactivate an agent account, **Then** the agent can no longer log in, their open tickets are flagged "Unassigned — Agent Deactivated", and the support manager is notified for reassignment.
4. **Given** an admin, **When** they create or edit a customer account, **Then** the customer can log in with their credentials and access only their own tickets.

---

### User Story 5 - Performance Reporting Dashboard (Priority: P3)

A support manager views a dashboard showing ticket volume trends, SLA compliance rates, average resolution times, agent performance metrics (tickets handled, average response time, customer satisfaction scores), and escalation counts — all filterable by date range, agent, category, and status.

**Why this priority**: Operational visibility adds significant management value but is not required for the system to function. Core support delivery (P1, P2) must work first; reporting is additive.

**Independent Test**: With at least 10 tickets across different statuses and agents, the manager opens the dashboard, applies a "Last 30 days" filter, and sees accurate aggregates for open/resolved count, SLA compliance percentage, and average resolution time — verifiable without other P3 features.

**Acceptance Scenarios**:

1. **Given** a support manager, **When** they open the reporting dashboard, **Then** they see a summary panel showing: total open tickets, tickets by status, SLA compliance percentage, average first response time, and average resolution time for the current period.
2. **Given** the dashboard with a date range filter applied, **When** the manager selects "Last 30 days", **Then** all metrics update to reflect only tickets within that period within 3 seconds.
3. **Given** an agent selected in the filter, **When** the manager views that agent's performance panel, **Then** they see: ticket count handled, average response time, resolution rate, and average customer satisfaction score.
4. **Given** the escalation summary section, **When** the manager views it, **Then** they see total escalations, top escalation reasons, and a list of currently breached tickets sortable by breach duration.

---

### Edge Cases

- What happens when a ticket is submitted outside configured business hours? (SLA timer starts at the beginning of the next business period)
- What happens if the assigned agent's account is deactivated while they have open tickets? (Tickets flagged for reassignment; manager notified)
- What happens if an SLA policy is edited while tickets using it are active? (Existing tickets retain the SLA targets in place at the time of ticket creation)
- What happens if a customer submits what appears to be a duplicate ticket? (System flags potential duplicates for agent review; agent can merge or keep separate)
- What happens if no agents are available for auto-assignment? (Ticket enters the unassigned queue; support manager is notified)
- What happens if the escalation recipient (manager) is also deactivated? (Escalation is sent to the Admin; admin is the final fallback for all escalations)
- What happens if a customer reopens a ticket more than 7 days after resolution? (Customer must create a new ticket; the original remains closed)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow all users (Admin, Support Manager, Support Agent, Customer) to authenticate via email and password with secure, time-limited sessions
- **FR-002**: System MUST enforce role-based access control — each role accesses only the features and data permitted for that role; violations MUST return an access-denied response
- **FR-003**: Customers MUST be able to create tickets with at minimum: title, description, priority (Low / Medium / High / Critical), and category; file attachments are optional
- **FR-004**: Customers MUST be able to view only their own tickets and the full chronological communication thread for each ticket
- **FR-005**: Agents MUST be able to view their assigned ticket queue, claim unassigned tickets, add public replies, add internal-only notes, change ticket status, and mark tickets resolved with a resolution summary
- **FR-006**: Support Managers MUST be able to assign and reassign tickets to any active agent, and view the full team's ticket queue
- **FR-007**: System MUST support auto-assignment of newly submitted tickets to available agents using round-robin distribution; fallback to unassigned queue when no agents are available
- **FR-008**: System MUST track elapsed time against the SLA policy assigned to each ticket, respecting business hours where configured
- **FR-009**: System MUST issue an SLA Warning notification when a ticket reaches 80% of its response or resolution time limit without the relevant milestone being met
- **FR-010**: System MUST mark tickets "SLA Breached", auto-escalate them to the support manager, and log the escalation event when SLA time limits are exceeded
- **FR-011**: Support Managers and Admins MUST be able to manually escalate any ticket, selecting a reason; escalation raises the ticket's priority by one tier (unless already Critical) and notifies the assigned agent
- **FR-012**: System MUST deliver notifications via email and in-app channel for: ticket creation, first agent assignment, agent reply, status change, SLA warning, SLA breach/escalation, and ticket resolution
- **FR-013**: Admins MUST be able to create, edit, and deactivate Support Agent and Customer accounts; deactivated accounts cannot authenticate
- **FR-014**: Admins MUST be able to define SLA policies specifying response time and resolution time targets per priority level, with a business-hours flag
- **FR-015**: Admins MUST be able to configure ticket categories; a default set (Technical, Billing, General, Feature Request) MUST be pre-loaded on setup
- **FR-016**: System MUST maintain an immutable audit log recording every change to a ticket: field changed, previous value, new value, actor, and timestamp
- **FR-017**: Support Managers and Admins MUST access a reporting dashboard displaying: ticket volume, status breakdown, SLA compliance rate, average first response time, average resolution time, agent performance metrics, and escalation summary
- **FR-018**: Reporting dashboard MUST support filtering by date range, agent, category, and ticket status; filtered results MUST load within 3 seconds

### Non-Functional Requirements *(constitution-aligned)*

- **NFR-SEC**: All user inputs MUST be validated and sanitized at system boundaries; authentication is required on all non-public endpoints; the system MUST comply with OWASP Top 10 (Principle IV)
- **NFR-PERF**: Ticket list views MUST load within 2 seconds; the reporting dashboard MUST render within 3 seconds; the system MUST support at least 500 concurrent active users without degradation (Principle VII)
- **NFR-A11Y**: All screens MUST comply with WCAG 2.1 AA; every user-facing screen MUST implement loading, error, and empty states (Principle VIII)
- **NFR-API**: All API routes MUST be versioned; an OpenAPI specification MUST be maintained and kept current before each release (Principle V)
- **NFR-COV**: The system MUST maintain ≥80% overall line coverage; authentication and ticket mutation code paths MUST achieve 100% branch coverage (Principle VI)

### Key Entities *(include if feature involves data)*

- **User**: Platform account; attributes: id, name, email, password hash, role (Admin | SupportManager | SupportAgent | Customer), active flag, last login timestamp
- **Customer**: Organisation or individual receiving support; attributes: id, company name, primary contact name, email, phone, tier, linked User accounts
- **Ticket**: Core support request; attributes: id, reference number, title, description, status (Open | InProgress | Pending | Resolved | Closed), priority, category, assignee (agent User), SLA policy reference, first-response-at, resolved-at, created-at, updated-at
- **Comment**: Message on a ticket; attributes: id, ticket id, author (User), content, visibility (Public | Internal), attachment URLs, created-at
- **Attachment**: File uploaded to a ticket or comment; attributes: id, file name, file size, storage URL, uploaded-by, created-at
- **SLA Policy**: Service level definition; attributes: id, name, priority level, max response time (minutes), max resolution time (minutes), business-hours only flag, warning threshold percentage
- **Escalation Event**: Record of an escalation; attributes: id, ticket id, type (Auto | Manual), reason, escalated-by (User or "System"), escalated-to (User), created-at
- **Notification**: Delivery record; attributes: id, recipient (User), channel (Email | InApp), event type, related ticket id, payload, sent-at, delivered flag
- **Audit Log**: Immutable change record; attributes: id, ticket id, field name, old value, new value, changed-by (User), changed-at

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Customers can submit a new support ticket in under 2 minutes from the login screen on their first use
- **SC-002**: Agents can view their full ticket queue, sorted by SLA urgency, and claim an unassigned ticket in under 30 seconds
- **SC-003**: SLA breach escalation notifications reach the responsible manager within 5 minutes of the breach occurring
- **SC-004**: The reporting dashboard displays up to 6 months of ticket data with filters applied in under 3 seconds
- **SC-005**: 95% of email notifications are delivered within 2 minutes of the triggering event
- **SC-006**: The system supports at least 500 concurrent active users without measurable response time degradation
- **SC-007**: Zero unauthorized cross-role data access events — customers cannot access other customers' tickets; agents cannot access admin configuration screens
- **SC-008**: A support manager can identify the top 3 SLA breach causes and overall team SLA compliance rate within 5 minutes of opening the reporting dashboard

## Assumptions

- Single-tenant deployment per organization for v1; multi-tenancy (multiple organizations sharing one instance) is out of scope
- Business hours default to Monday–Friday, 09:00–17:00 in the organization's configured timezone; SLA timers observe business hours when the SLA policy's business-hours flag is enabled
- Email is the primary notification channel; in-app notifications are secondary (bell icon in the application header)
- Auto-assignment distributes new tickets round-robin among agents whose availability status is "Available"; agents can toggle their availability
- Customer self-registration is permitted; email verification is required before a customer account becomes active
- Ticket categories are Admin-configurable; default categories (Technical, Billing, General, Feature Request) are pre-loaded on first setup
- Customer self-service features (knowledge base, FAQ, chatbot) are out of scope for v1
- Soft delete is used for all records; hard deletes do not occur in the system
- Customer satisfaction (CSAT) rating is optional and presented once per resolved ticket; customers have 7 days post-resolution to rate
- Customers may reopen a resolved ticket within 7 days of resolution; after that, a new ticket must be submitted
