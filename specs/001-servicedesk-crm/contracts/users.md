# API Contract: Users, Customers, Categories & SLA Policies

All endpoints require authentication. Role access noted per endpoint.

---

## Users

Base path: `/api/v1/users`

### User Object
```json
{
  "id": "uuid",
  "name": "Bob Agent",
  "email": "bob@company.com",
  "role": "SUPPORT_AGENT",
  "isActive": true,
  "isAvailable": true,
  "lastLoginAt": "2026-06-13T08:00:00Z",
  "createdAt": "2026-06-01T00:00:00Z"
}
```

---

### GET /api/v1/users

List all users.

**Access**: Admin, Support Manager

**Query Parameters**: `role`, `isActive`, `page`, `limit`

**Success** `200 OK`:
```json
{
  "data": [ /* User[] */ ],
  "meta": { "total": 20, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### POST /api/v1/users

Create a new agent or manager account (sends invitation email).

**Access**: Admin

**Request Body**:
```json
{
  "name": "Alice Manager",
  "email": "alice@company.com",
  "role": "SUPPORT_MANAGER"
}
```

**Success** `201 Created`: User object (passwordHash omitted; invitation email sent)

**Side effects**: AGENT_INVITED notification email with accept-invitation link (48-hour expiry).

**Errors**: `400` invalid input | `409` email already registered | `400` invalid role (cannot create CUSTOMER via this endpoint)

---

### GET /api/v1/users/:id

Get a single user.

**Access**: Admin, Support Manager; users can fetch their own profile

**Success** `200 OK`: User object

**Errors**: `403` access denied | `404` not found

---

### PUT /api/v1/users/:id

Update a user's name or availability.

**Access**: Admin (any field); user (own name + isAvailable only)

**Request Body**:
```json
{
  "name": "Bob Senior Agent",
  "isAvailable": false
}
```

**Success** `200 OK`: Updated User object

**Errors**: `403` access denied | `400` invalid input

---

### PATCH /api/v1/users/:id/deactivate

Deactivate a user account (soft delete — sets `isActive = false`).

**Access**: Admin

**Request Body**: none

**Success** `200 OK`:
```json
{ "message": "User deactivated. Open tickets flagged for reassignment." }
```

**Side effects**: All refresh tokens revoked; open assigned tickets set to `assigneeId = null` and flagged; Support Manager notified.

**Errors**: `400` cannot deactivate the last active Admin | `404` not found

---

### PATCH /api/v1/users/:id/activate

Reactivate a deactivated user.

**Access**: Admin

**Success** `200 OK`: Updated User object

---

### GET /api/v1/users/me

Get the current authenticated user's profile.

**Access**: All authenticated roles

**Success** `200 OK`: User object

---

### PATCH /api/v1/users/me/password

Change own password.

**Access**: All authenticated roles

**Request Body**:
```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss2"
}
```

**Success** `200 OK`: `{ "message": "Password updated." }`

**Errors**: `400` current password incorrect | `400` new password too weak

---

## Customers

Base path: `/api/v1/customers`

### Customer Object
```json
{
  "id": "uuid",
  "companyName": "Acme Corp",
  "primaryContact": "Jane Smith",
  "phone": "+1-555-0100",
  "tier": "premium",
  "user": { "id": "uuid", "email": "jane@acme.com", "isActive": true },
  "createdAt": "2026-06-01T00:00:00Z"
}
```

---

### GET /api/v1/customers

**Access**: Admin, Support Manager

**Query Parameters**: `tier`, `search` (name/email), `page`, `limit`

**Success** `200 OK`: Paginated Customer list

---

### POST /api/v1/customers

Create a new customer account (Admin-managed; bypasses self-registration flow).

**Access**: Admin

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "companyName": "Acme Corp",
  "phone": "+1-555-0100",
  "tier": "premium"
}
```

**Success** `201 Created`: Customer object (invitation email sent for password setup)

---

### GET /api/v1/customers/:id

**Access**: Admin, Support Manager

**Success** `200 OK`: Customer object

---

### PUT /api/v1/customers/:id

Update customer details.

**Access**: Admin

**Request Body**: Any subset of `companyName`, `primaryContact`, `phone`, `tier`

**Success** `200 OK`: Updated Customer object

---

## Categories

Base path: `/api/v1/categories`

### GET /api/v1/categories

**Access**: All authenticated roles

**Success** `200 OK`:
```json
{
  "data": [
    { "id": "uuid", "name": "Technical", "isActive": true },
    { "id": "uuid", "name": "Billing", "isActive": true }
  ]
}
```

---

### POST /api/v1/categories

**Access**: Admin

**Request Body**: `{ "name": "Feature Request" }`

**Success** `201 Created`: Category object

**Errors**: `409` name already exists

---

### PUT /api/v1/categories/:id

**Access**: Admin

**Request Body**: `{ "name": "New Name", "isActive": true }`

**Success** `200 OK`: Updated Category object

---

### DELETE /api/v1/categories/:id

Deactivate a category (soft; cannot delete if tickets use it).

**Access**: Admin

**Success** `200 OK`: `{ "message": "Category deactivated." }`

**Errors**: `409` category has active tickets

---

## SLA Policies

Base path: `/api/v1/sla-policies`

### SLA Policy Object
```json
{
  "id": "uuid",
  "name": "High Priority SLA",
  "priority": "HIGH",
  "maxResponseMinutes": 60,
  "maxResolutionMinutes": 480,
  "businessHoursOnly": true,
  "warningThreshold": 0.8,
  "isActive": true,
  "createdAt": "2026-06-01T00:00:00Z"
}
```

---

### GET /api/v1/sla-policies

**Access**: All authenticated roles

**Success** `200 OK`: Array of SLA Policy objects

---

### POST /api/v1/sla-policies

**Access**: Admin

**Request Body**:
```json
{
  "name": "Critical SLA",
  "priority": "CRITICAL",
  "maxResponseMinutes": 15,
  "maxResolutionMinutes": 120,
  "businessHoursOnly": false,
  "warningThreshold": 0.8
}
```

**Success** `201 Created`: SLA Policy object

**Errors**: `409` SLA policy for this priority already exists

---

### PUT /api/v1/sla-policies/:id

**Access**: Admin

**Note**: Existing tickets retain the SLA targets from the time of their creation. Changes apply to new tickets only.

**Success** `200 OK`: Updated SLA Policy object

---

### DELETE /api/v1/sla-policies/:id

Deactivate an SLA policy.

**Access**: Admin

**Success** `200 OK`: `{ "message": "SLA policy deactivated." }`

**Errors**: `409` policy is currently the active policy for its priority (must replace before deactivating)

---

## Business Hours

Base path: `/api/v1/config/business-hours`

### GET /api/v1/config/business-hours

**Access**: All authenticated roles

**Success** `200 OK`:
```json
{
  "timezone": "UTC",
  "schedule": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isActive": true },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "isActive": true }
  ]
}
```

---

### PUT /api/v1/config/business-hours

**Access**: Admin

**Request Body**:
```json
{
  "timezone": "America/New_York",
  "schedule": [
    { "dayOfWeek": 1, "startTime": "08:00", "endTime": "18:00", "isActive": true },
    { "dayOfWeek": 6, "startTime": "09:00", "endTime": "13:00", "isActive": true }
  ]
}
```

**Success** `200 OK`: Updated schedule

**Note**: Changes affect SLA calculations for new tickets only. Existing `slaResponseDue` / `slaResolutionDue` timestamps are not recalculated.
