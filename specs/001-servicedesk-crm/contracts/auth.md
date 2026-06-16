# API Contract: Authentication

Base path: `/api/v1/auth`

All responses use the uniform error envelope on failure:
```json
{ "error": { "code": "string", "message": "string" } }
```

Access token and refresh token are delivered/cleared via `httpOnly` cookies.

---

## POST /api/v1/auth/register

Register a new Customer account. Email verification required before login.

**Access**: Public

**Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecureP@ss1"
}
```

**Success** `201 Created`:
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Errors**: `400` invalid input | `409` email already registered

---

## POST /api/v1/auth/verify-email

Verify email address using the token sent by email.

**Access**: Public

**Request Body**:
```json
{ "token": "uuid-token-from-email" }
```

**Success** `200 OK`:
```json
{ "message": "Email verified. You can now log in." }
```

**Errors**: `400` invalid/expired token

---

## POST /api/v1/auth/login

Authenticate and receive session cookies.

**Access**: Public

**Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "SecureP@ss1"
}
```

**Success** `200 OK` (sets `accessToken` + `refreshToken` httpOnly cookies):
```json
{
  "user": {
    "id": "uuid",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "CUSTOMER"
  }
}
```

**Errors**: `400` invalid input | `401` invalid credentials | `403` email not verified | `403` account deactivated

---

## POST /api/v1/auth/refresh

Obtain a new access token using the refresh token cookie.

**Access**: Public (requires valid `refreshToken` cookie)

**Request Body**: none

**Success** `200 OK` (sets new `accessToken` cookie):
```json
{ "message": "Token refreshed." }
```

**Errors**: `401` missing/expired/revoked refresh token

---

## POST /api/v1/auth/logout

Revoke the current session.

**Access**: Authenticated

**Request Body**: none

**Success** `200 OK` (clears both cookies):
```json
{ "message": "Logged out." }
```

---

## POST /api/v1/auth/forgot-password

Send a password reset email.

**Access**: Public

**Request Body**:
```json
{ "email": "jane@example.com" }
```

**Success** `200 OK` (same response whether email exists or not — prevents enumeration):
```json
{ "message": "If that email exists, a reset link has been sent." }
```

---

## POST /api/v1/auth/reset-password

Set a new password using the reset token from email.

**Access**: Public

**Request Body**:
```json
{
  "token": "uuid-reset-token",
  "password": "NewSecureP@ss1"
}
```

**Success** `200 OK`:
```json
{ "message": "Password reset successful. Please log in." }
```

**Errors**: `400` invalid input | `400` token expired or already used

---

## POST /api/v1/auth/accept-invitation

Accept an agent/manager invitation and set initial password.

**Access**: Public

**Request Body**:
```json
{
  "token": "uuid-invitation-token",
  "password": "MyInitialP@ss1"
}
```

**Success** `200 OK`:
```json
{ "message": "Account activated. Please log in." }
```

**Errors**: `400` invalid/expired token
