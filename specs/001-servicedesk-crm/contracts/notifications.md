# API Contract: Notifications

Base path: `/api/v1/notifications`

All endpoints require authentication. Users see only their own notifications.

---

## Notification Object

```json
{
  "id": "uuid",
  "channel": "IN_APP",
  "eventType": "TICKET_REPLY",
  "payload": {
    "ticketId": "uuid",
    "referenceNumber": "SD-00001",
    "title": "Cannot log in to portal",
    "actorName": "Bob Agent",
    "message": "We are investigating the issue."
  },
  "isRead": false,
  "sentAt": "2026-06-13T09:15:00Z",
  "readAt": null,
  "ticket": { "id": "uuid", "referenceNumber": "SD-00001" },
  "createdAt": "2026-06-13T09:15:00Z"
}
```

---

## GET /api/v1/notifications

Retrieve the current user's notifications.

**Access**: All authenticated roles

**Query Parameters**:
| Param | Type | Description |
|---|---|---|
| `isRead` | boolean | Filter by read status |
| `eventType` | string | Filter by event type |
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (default: 20, max: 50) |

**Success** `200 OK`:
```json
{
  "data": [ /* Notification[] */ ],
  "meta": {
    "total": 12,
    "unreadCount": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## GET /api/v1/notifications/unread-count

Lightweight endpoint for the notification bell badge.

**Access**: All authenticated roles

**Success** `200 OK`:
```json
{ "unreadCount": 3 }
```

---

## PATCH /api/v1/notifications/:id/read

Mark a single notification as read.

**Access**: Recipient only

**Request Body**: none

**Success** `200 OK`: Updated Notification object

**Errors**: `403` not recipient | `404` not found

---

## PATCH /api/v1/notifications/read-all

Mark all of the current user's unread notifications as read.

**Access**: All authenticated roles

**Request Body**: none

**Success** `200 OK`:
```json
{ "message": "All notifications marked as read.", "updatedCount": 3 }
```

---

## Notification Event Types

| Event | Trigger | Recipients |
|---|---|---|
| `TICKET_CREATED` | Customer submits ticket | Customer (confirmation) |
| `TICKET_ASSIGNED` | Ticket assigned to agent | Agent, Customer |
| `TICKET_REPLY` | Agent/customer adds PUBLIC comment | Opposite party (agent→customer, customer→agent/manager) |
| `TICKET_STATUS_CHANGED` | Status changes | Customer, Assignee |
| `TICKET_RESOLVED` | Status → RESOLVED | Customer |
| `SLA_WARNING` | 80% of SLA elapsed | Assignee, Support Manager |
| `SLA_BREACHED` | SLA deadline exceeded | Assignee, Support Manager, Admin |
| `TICKET_ESCALATED` | Auto or manual escalation | Assignee, escalated-to user |
| `CSAT_REQUEST` | Ticket resolved | Customer (email + in-app; 7-day window) |
| `AGENT_INVITED` | Admin creates agent/manager | New user (email only) |
| `PASSWORD_RESET` | Forgot-password request | User (email only) |

---

## Firebase Push Notification Registration

### POST /api/v1/notifications/fcm-token

Register or update a Firebase Cloud Messaging device token for the current user.

**Access**: All authenticated roles

**Request Body**:
```json
{ "fcmToken": "firebase-device-token-string" }
```

**Success** `200 OK`:
```json
{ "message": "FCM token registered." }
```

**Note**: Tokens are stored per user and used by `push.provider.ts` to deliver browser push notifications. If the user revokes browser push permission, the stale token is silently dropped on the next failed FCM send.
