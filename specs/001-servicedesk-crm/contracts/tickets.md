# API Contract: Tickets, Comments & Attachments

Base path: `/api/v1/tickets`

All endpoints require authentication. Role access noted per endpoint.

---

## Ticket Object

```json
{
  "id": "uuid",
  "referenceNumber": "SD-00001",
  "title": "Cannot log in to portal",
  "description": "I receive an error 500 when trying to log in...",
  "status": "OPEN",
  "priority": "HIGH",
  "slaStatus": null,
  "category": { "id": "uuid", "name": "Technical" },
  "customer": { "id": "uuid", "companyName": "Acme Corp", "primaryContact": "Jane Smith" },
  "assignee": { "id": "uuid", "name": "Bob Agent" },
  "slaPolicy": { "id": "uuid", "name": "High Priority SLA" },
  "slaResponseDue": "2026-06-13T11:00:00Z",
  "slaResolutionDue": "2026-06-13T17:00:00Z",
  "firstResponseAt": null,
  "resolvedAt": null,
  "csatScore": null,
  "createdAt": "2026-06-13T09:00:00Z",
  "updatedAt": "2026-06-13T09:00:00Z"
}
```

---

## GET /api/v1/tickets

List tickets. Results filtered by role automatically:
- Customer: own tickets only
- Support Agent: assigned tickets + unassigned queue
- Support Manager / Admin: all tickets

**Access**: All authenticated roles

**Query Parameters**:
| Param | Type | Description |
|---|---|---|
| `status` | enum | Filter by status (OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED) |
| `priority` | enum | Filter by priority (LOW, MEDIUM, HIGH, CRITICAL) |
| `slaStatus` | enum | WARNING \| BREACHED |
| `assigneeId` | uuid | Filter by assigned agent |
| `categoryId` | uuid | Filter by category |
| `search` | string | Full-text search on title |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20, max: 100) |
| `sortBy` | string | `slaResponseDue` \| `createdAt` \| `updatedAt` \| `priority` |
| `sortOrder` | string | `asc` \| `desc` (default: `asc`) |

**Success** `200 OK`:
```json
{
  "data": [ /* Ticket[] */ ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## POST /api/v1/tickets

Create a new ticket.

**Access**: Customer, Admin

**Request Body**:
```json
{
  "title": "Cannot log in to portal",
  "description": "I receive an error 500 when trying to log in...",
  "priority": "HIGH",
  "categoryId": "uuid"
}
```

**Success** `201 Created`: Full Ticket object

**Side effects**: Auto-assignment attempted; SLA due dates calculated and set; TICKET_CREATED notification sent; audit log entry created.

**Errors**: `400` invalid input | `404` category not found

---

## GET /api/v1/tickets/:id

Get a single ticket with full details.

**Access**: Customer (own only), Agent, Manager, Admin

**Success** `200 OK`: Full Ticket object with `comments` array included (paginated separately — see Comments section)

**Errors**: `403` access denied | `404` not found

---

## PATCH /api/v1/tickets/:id/status

Update ticket status.

**Access**: Support Agent (own tickets), Support Manager, Admin

**Request Body**:
```json
{ "status": "IN_PROGRESS" }
```

**Valid transitions**:
- OPEN → IN_PROGRESS, PENDING
- IN_PROGRESS → PENDING, RESOLVED
- PENDING → IN_PROGRESS, RESOLVED
- RESOLVED → OPEN (reopen, within 7 days, by Customer or Agent)

**Success** `200 OK`: Updated Ticket object

**Side effects**: Audit log; TICKET_STATUS_CHANGED notification; if status = RESOLVED, set `resolvedAt`, stop SLA timer, send CSAT_REQUEST notification.

**Errors**: `400` invalid transition | `403` access denied | `404` not found

---

## PATCH /api/v1/tickets/:id/assign

Assign or reassign a ticket to an agent.

**Access**: Support Manager, Admin

**Request Body**:
```json
{ "assigneeId": "uuid" }
```

**Success** `200 OK`: Updated Ticket object

**Side effects**: Audit log; TICKET_ASSIGNED notification to new assignee; if `firstResponseAt` is null and agent is now assigned, this does not set firstResponseAt (first response = first public comment).

**Errors**: `400` agent not found or inactive | `403` access denied

---

## PATCH /api/v1/tickets/:id/claim

Agent claims an unassigned ticket.

**Access**: Support Agent

**Request Body**: none

**Success** `200 OK`: Updated Ticket object (assignee = requesting agent)

**Errors**: `409` ticket already assigned | `403` access denied

---

## POST /api/v1/tickets/:id/escalate

Manually escalate a ticket.

**Access**: Support Manager, Admin

**Request Body**:
```json
{
  "reason": "Customer is a key account and SLA breach is imminent"
}
```

**Success** `201 Created`:
```json
{
  "escalation": {
    "id": "uuid",
    "type": "MANUAL",
    "reason": "...",
    "escalatedTo": { "id": "uuid", "name": "Manager Name" },
    "createdAt": "..."
  }
}
```

**Side effects**: Priority raised by one tier (unless CRITICAL); TICKET_ESCALATED notification; audit log entry.

**Errors**: `400` missing reason | `403` access denied

---

## POST /api/v1/tickets/:id/csat

Submit a CSAT rating for a resolved ticket.

**Access**: Customer (own ticket only)

**Request Body**:
```json
{
  "score": 4,
  "comment": "Fast response, but issue took longer than expected."
}
```

**Success** `200 OK`:
```json
{ "message": "Thank you for your feedback." }
```

**Errors**: `400` invalid score (must be 1–5) | `403` access denied or window expired | `409` already submitted

---

## Comments

### GET /api/v1/tickets/:ticketId/comments

**Access**: Customer (PUBLIC only), Agent/Manager/Admin (PUBLIC + INTERNAL)

**Query Parameters**: `page`, `limit` (default 20)

**Success** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "content": "We are investigating the issue.",
      "visibility": "PUBLIC",
      "author": { "id": "uuid", "name": "Bob Agent", "role": "SUPPORT_AGENT" },
      "attachments": [],
      "createdAt": "2026-06-13T09:15:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### POST /api/v1/tickets/:ticketId/comments

Add a comment to a ticket.

**Access**: Customer (PUBLIC only), Agent/Manager/Admin (PUBLIC or INTERNAL)

**Request Body**:
```json
{
  "content": "We are investigating the issue.",
  "visibility": "PUBLIC",
  "attachmentIds": ["uuid"]
}
```

**Success** `201 Created`: Comment object

**Side effects**: If first PUBLIC comment by an agent and `firstResponseAt` is null → set `firstResponseAt`; send TICKET_REPLY notification to customer (for PUBLIC comments).

**Errors**: `400` customer attempting INTERNAL visibility | `400` invalid attachmentId

---

### DELETE /api/v1/tickets/:ticketId/comments/:id

Soft-delete a comment (author only, within 5 minutes of creation).

**Access**: Comment author

**Success** `204 No Content`

**Errors**: `403` not author or window expired | `404` not found

---

## Attachments

### POST /api/v1/tickets/:ticketId/attachments/presign

Request a presigned S3 PUT URL for direct upload.

**Access**: Authenticated

**Request Body**:
```json
{
  "fileName": "screenshot.png",
  "fileSize": 204800,
  "mimeType": "image/png"
}
```

**Success** `200 OK`:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/key?...",
  "storageKey": "attachments/uuid/screenshot.png",
  "expiresIn": 300
}
```

**Errors**: `400` unsupported MIME type | `400` file too large (>10 MB) | `400` ticket already has 5 attachments

---

### POST /api/v1/tickets/:ticketId/attachments/confirm

Confirm that a direct-to-S3 upload completed and record the attachment.

**Access**: Authenticated

**Request Body**:
```json
{
  "storageKey": "attachments/uuid/screenshot.png",
  "fileName": "screenshot.png",
  "fileSize": 204800,
  "mimeType": "image/png"
}
```

**Success** `201 Created`:
```json
{
  "id": "uuid",
  "fileName": "screenshot.png",
  "fileSize": 204800,
  "mimeType": "image/png",
  "downloadUrl": "https://s3.amazonaws.com/...",
  "createdAt": "..."
}
```

---

### DELETE /api/v1/tickets/:ticketId/attachments/:id

Delete an attachment (uploader or Admin only).

**Access**: Uploader, Admin

**Success** `204 No Content` (S3 object also deleted)

---

## Audit Log

### GET /api/v1/tickets/:ticketId/audit

Retrieve the immutable audit trail for a ticket.

**Access**: Support Manager, Admin

**Success** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "fieldName": "status",
      "oldValue": "OPEN",
      "newValue": "IN_PROGRESS",
      "changedBy": { "id": "uuid", "name": "Bob Agent" },
      "changedAt": "2026-06-13T09:30:00Z"
    }
  ]
}
```
