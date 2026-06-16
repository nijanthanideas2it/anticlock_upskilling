# API Contract: Reporting Dashboard

Base path: `/api/v1/reports`

**Access**: Support Manager, Admin (all endpoints in this group)

All date filters use ISO 8601 format (`YYYY-MM-DDThh:mm:ssZ`). Default range when omitted: last 30 days.

---

## Common Query Parameters (all report endpoints)

| Param | Type | Description |
|---|---|---|
| `from` | ISO date | Range start (inclusive) |
| `to` | ISO date | Range end (inclusive) |
| `agentId` | uuid | Filter metrics to a single agent |
| `categoryId` | uuid | Filter to a category |
| `status` | enum | Filter by ticket status |

---

## GET /api/v1/reports/overview

Summary panel — key KPIs for the selected period.

**Success** `200 OK`:
```json
{
  "period": { "from": "2026-05-14T00:00:00Z", "to": "2026-06-13T23:59:59Z" },
  "totalTickets": 318,
  "ticketsByStatus": {
    "OPEN": 42,
    "IN_PROGRESS": 67,
    "PENDING": 15,
    "RESOLVED": 181,
    "CLOSED": 13
  },
  "slaComplianceRate": 0.87,
  "avgFirstResponseMinutes": 38,
  "avgResolutionMinutes": 312,
  "totalEscalations": 9,
  "avgCsatScore": 4.2,
  "openTickets": 124
}
```

---

## GET /api/v1/reports/tickets

Ticket volume trend — daily/weekly breakdown for charting.

**Query Parameters** (in addition to common params):
| Param | Type | Description |
|---|---|---|
| `groupBy` | string | `day` \| `week` (default: `day`) |

**Success** `200 OK`:
```json
{
  "period": { "from": "...", "to": "..." },
  "groupBy": "day",
  "series": [
    {
      "date": "2026-06-01",
      "created": 12,
      "resolved": 9,
      "breached": 1
    }
  ]
}
```

---

## GET /api/v1/reports/agents

Per-agent performance metrics.

**Success** `200 OK`:
```json
{
  "period": { "from": "...", "to": "..." },
  "agents": [
    {
      "agentId": "uuid",
      "agentName": "Bob Agent",
      "ticketsHandled": 54,
      "ticketsResolved": 48,
      "avgFirstResponseMinutes": 22,
      "avgResolutionMinutes": 240,
      "slaComplianceRate": 0.94,
      "avgCsatScore": 4.5,
      "escalationCount": 2
    }
  ]
}
```

---

## GET /api/v1/reports/sla

SLA compliance breakdown by priority and breach causes.

**Success** `200 OK`:
```json
{
  "period": { "from": "...", "to": "..." },
  "overall": {
    "complianceRate": 0.87,
    "totalBreaches": 9,
    "avgBreachDurationMinutes": 48
  },
  "byPriority": [
    {
      "priority": "CRITICAL",
      "total": 18,
      "breaches": 1,
      "complianceRate": 0.94
    },
    {
      "priority": "HIGH",
      "total": 72,
      "breaches": 4,
      "complianceRate": 0.94
    }
  ],
  "currentlyBreached": [
    {
      "ticketId": "uuid",
      "referenceNumber": "SD-00042",
      "title": "Payment processing failure",
      "priority": "CRITICAL",
      "assignee": { "id": "uuid", "name": "Bob Agent" },
      "breachDurationMinutes": 37,
      "slaResolutionDue": "2026-06-13T07:00:00Z"
    }
  ]
}
```

---

## GET /api/v1/reports/escalations

Escalation summary with top reasons.

**Success** `200 OK`:
```json
{
  "period": { "from": "...", "to": "..." },
  "total": 9,
  "byType": { "AUTO": 6, "MANUAL": 3 },
  "topReasons": [
    { "reason": "Key account SLA breach", "count": 3 },
    { "reason": "Automatic SLA breach", "count": 6 }
  ],
  "recentEscalations": [
    {
      "id": "uuid",
      "type": "AUTO",
      "reason": "Automatic SLA breach",
      "ticket": { "id": "uuid", "referenceNumber": "SD-00042", "title": "Payment processing failure" },
      "escalatedTo": { "id": "uuid", "name": "Alice Manager" },
      "createdAt": "2026-06-13T07:02:00Z"
    }
  ]
}
```
