# Rentezzi — Backend API Documentation

> Written for frontend developers. Every endpoint, exact request shape, exact response shape, headers, validation rules, and edge cases are documented here.

---

## Server Info

```
Development:  http://localhost:5000/api/v1
Production:   https://your-api-domain.com/api/v1
```

The server runs on port `5000` by default (set via `PORT` in `.env`).
All routes are prefixed with `/api/v1`.

---

## Important Notes Before You Start

### CORS
The server currently has `app.use(cors())` with no origin restriction — **all origins are allowed in development**. Before going to production, the backend must restrict this to your frontend URL.

### Content-Type
All requests must send `Content-Type: application/json` unless uploading a file, in which case use `multipart/form-data`.

### Authentication
All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <accessToken>
```
The `accessToken` expires in `15m`. The `refreshToken` expires in `7d`. Store both in Redux state (persisted via redux-persist). When the access token expires, the user must log in again — **refresh token rotation is not yet active**.

---

## Standard Response Envelope

Every JSON response — success or error — uses this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human readable message",
  "data": {}
}
```

**On delete / logout / send-otp / change-password** — `data` field is omitted entirely:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

**On error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errorSources": [
    { "path": "phone", "message": "Phone number is required" }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `401` | Missing or expired token |
| `403` | Forbidden — you don't own this resource |
| `404` | Not found |
| `409` | Conflict — e.g. phone already registered |
| `429` | Too many OTP attempts |
| `500` | Server error |

---

## 🔐 Auth — `/api/v1/auth`

### OTP Registration Flow — 3 Steps

Registration requires phone verification via WhatsApp OTP. The flow is:

```
Step 1: POST /auth/send-otp      → OTP sent to WhatsApp
Step 2: POST /auth/verify-otp    → returns otpToken (15min JWT)
Step 3: POST /auth/register      → send otpToken + user details → account created
```

---

### POST `/auth/send-otp`
**Public.** Generates a 6-digit OTP, sends it to the user's WhatsApp number. Call this for both registration and password change.

**Request body:**
```json
{
  "phone": "01712345678",
  "purpose": "register"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `phone` | string | Required. Bangladeshi format: `01[3-9]XXXXXXXX` (11 digits) |
| `purpose` | string | Required. Either `"register"` or `"change-password"` |

**Notes:**
- For `purpose: "register"` — server rejects the request if the phone is already registered (`409`)
- For `purpose: "change-password"` — server rejects if the phone does not exist (`404`)
- Any previous unused OTP for that phone is invalidated when a new one is requested
- OTP expires in **10 minutes**

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP sent to WhatsApp number 01712345678"
}
```

---

### POST `/auth/verify-otp`
**Public.** Verifies the OTP the user received on WhatsApp. Returns a short-lived `otpToken` on success.

**Request body:**
```json
{
  "phone": "01712345678",
  "otp": "482910",
  "purpose": "register"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `phone` | string | Required. Same phone used in `send-otp` |
| `otp` | string | Required. Exactly 6 digits |
| `purpose` | string | Required. `"register"` or `"change-password"` — must match what was used in `send-otp` |

**Notes:**
- Max **5 failed attempts** — after 5 wrong OTPs the record is deleted and the user must request a new OTP
- Each wrong attempt returns remaining count: `"Incorrect OTP. 3 attempts remaining."`
- The OTP can only be used **once** — it is marked as used immediately on success
- The returned `otpToken` is a JWT valid for **15 minutes**
- The `otpToken` is **scoped to the purpose** — a token generated for `"register"` cannot be used for `"change-password"` and vice versa

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OTP verified successfully",
  "data": {
    "otpToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

> Store `otpToken` temporarily in component state (not Redux). It is only needed for the next step and should be discarded after use.

---

### POST `/auth/register`
**Public.** Creates the user account. Requires `otpToken` from `verify-otp`.

**Request body:**
```json
{
  "name": "John Doe",
  "phone": "01712345678",
  "password": "secret123",
  "otpToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required. 1–100 characters |
| `phone` | string | Required. Bangladeshi format `01[3-9]XXXXXXXX` |
| `password` | string | Required. 6–50 characters |
| `otpToken` | string | Required. JWT from `verify-otp` with `purpose: "register"` |

**Notes:**
- Password is hashed with bcrypt (salt rounds from config) before storage — never stored in plain text
- Server validates that `otpToken.phone === body.phone` — mismatched phones are rejected
- Server validates that `otpToken.purpose === "register"` — wrong purpose is rejected

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "phone": "01712345678"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/auth/login`
**Public.** Authenticates an existing user with phone and password.

**Request body:**
```json
{
  "phone": "01712345678",
  "password": "secret123"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `phone` | string | Required |
| `password` | string | Required |

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "John Doe",
      "phone": "01712345678"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET `/auth/me`
**Protected.** Returns the authenticated user's profile.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "John Doe",
    "phone": "01712345678",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

> `password` and `refreshTokens` are never returned.

---

### POST `/auth/logout`
**Protected.** Invalidates the refresh token — user must log in again to get new tokens.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully"
}
```

---

### POST `/auth/change-password`
**Protected.** Changes the user's password. Requires both a valid Bearer token AND a WhatsApp OTP verification.

**OTP flow for change-password:**
```
Step 1: POST /auth/send-otp      { phone, purpose: "change-password" }
Step 2: POST /auth/verify-otp    { phone, otp, purpose: "change-password" } → otpToken
Step 3: POST /auth/change-password  { newPassword, otpToken }  + Bearer token header
```

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Request body:**
```json
{
  "newPassword": "newSecret456",
  "otpToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Field | Type | Rules |
|-------|------|-------|
| `newPassword` | string | Required. 6–50 characters |
| `otpToken` | string | Required. JWT from `verify-otp` with `purpose: "change-password"` |

**Notes:**
- After successful password change, **all sessions are invalidated** (all refresh tokens wiped) — user is logged out on all devices
- New password is hashed with bcrypt before storage

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Password changed successfully"
}
```

---

## 🏠 Properties — `/api/v1/properties`

> All property routes require `Authorization: Bearer <accessToken>`. Every response is scoped to the authenticated user — users can only see and modify their own properties.

---

### GET `/properties`
Returns all properties belonging to the authenticated user.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "All properties fetched successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "userId": "64f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Green View Apartments",
      "address": "123 Main Street, Dhaka",
      "units": [
        {
          "_id": "64f1a2b3c4d5e6f7a8b9c0d3",
          "name": "Flat 3A",
          "tenant": {
            "name": "Rahim Uddin",
            "phone": "01812345678",
            "rentStartDate": "2024-01-01",
            "rentAmount": 15000,
            "waterBill": 500,
            "gasBill": 300,
            "otherBills": null
          }
        },
        {
          "_id": "64f1a2b3c4d5e6f7a8b9c0d4",
          "name": "Flat 3B",
          "tenant": null
        }
      ],
      "tenantHistory": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/properties/:id`
Returns a single property by ID.

**Response `200`:** Same shape as a single item from the array above.

**Errors:**
- `404` — Property not found or does not belong to the user

---

### POST `/properties/create-property`
Creates a new property. Units are added separately after creation.

**Request body:**
```json
{
  "name": "Green View Apartments",
  "address": "123 Main Street, Dhaka"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required. Max 100 characters |
| `address` | string | Required. Max 200 characters |

**Response `201`:** Full property object (same shape as GET, with empty `units: []`).

---

### PATCH `/properties/update-property/:id`
Updates a property's name or address. Both fields are optional.

**Request body:**
```json
{
  "name": "Blue Sky Apartments",
  "address": "456 New Street, Dhaka"
}
```

**Response `200`:** Updated property object.

---

### DELETE `/properties/delete-property/:id`
Permanently deletes a property and all its units and tenant history.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Property deleted successfully"
}
```

---

### POST `/properties/:id/add-unit`
Adds a unit to a property. Units start vacant (`tenant: null`).

**Request body:**
```json
{
  "name": "Flat 3A"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required. Max 50 characters |

**Response `201`:** Full updated property object including the new unit.

---

### PATCH `/properties/:id/update-unit/:unitId`
Renames a unit.

**Request body:**
```json
{
  "name": "Flat 3A (Renovated)"
}
```

**Response `200`:** Full updated property object.

---

### DELETE `/properties/:id/delete-unit/:unitId`
Permanently deletes a unit. If the unit has a tenant, the tenant is also deleted.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Unit deleted successfully"
}
```

---

### PUT `/properties/:id/units/:unitId/assign-tenant`
Assigns a tenant to a vacant unit.

**Important:** A unit must have `tenant: null` before assigning. If the unit already has a tenant, the server returns `400`. Use `clear-tenant` first.

**Request body:**
```json
{
  "name": "Rahim Uddin",
  "phone": "01812345678",
  "rentStartDate": "2024-01-01",
  "rentAmount": 15000,
  "waterBill": 500,
  "gasBill": 300,
  "otherBills": null
}
```

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | Required |
| `phone` | string | Required |
| `rentStartDate` | string | Required. ISO date string e.g. `"2024-01-01"` |
| `rentAmount` | number | Required. Min 0 |
| `waterBill` | number | Optional. Min 0 |
| `gasBill` | number | Optional. Min 0 |
| `otherBills` | number | Optional. Min 0 |

**Response `200`:** Full updated property object.

---

### DELETE `/properties/:id/units/:unitId/clear-tenant`
Removes the current tenant from a unit and **saves them to tenant history**. The unit becomes vacant (`tenant: null`).

**Request body (optional):**
```json
{
  "notes": "Tenant left due to relocation"
}
```

| Field | Type | Rules |
|-------|------|-------|
| `notes` | string | Optional. Max 500 characters. Reason for leaving |

**Notes:**
- The tenant is NOT permanently deleted — they are snapshotted into `tenantHistory` on the property with a `vacatedAt` timestamp
- Use GET `/properties/tenant-history` or GET `/properties/:id/tenant-history` to retrieve them later

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tenant removed and moved to history successfully"
}
```

---

### GET `/properties/vacancy-summary`
Returns aggregated vacancy statistics across all of the user's properties.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Vacancy summary fetched successfully",
  "data": {
    "totalUnits": 12,
    "occupiedUnits": 9,
    "vacantUnits": 3
  }
}
```

---

### GET `/properties/tenant-history`
Returns all past tenants across **all** of the user's properties, sorted by most recently vacated first.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tenant history fetched successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d5",
      "unitId": "64f1a2b3c4d5e6f7a8b9c0d3",
      "unitName": "Flat 3A",
      "tenant": {
        "name": "Karim Ahmed",
        "phone": "01912345678",
        "rentStartDate": "2023-06-01",
        "rentAmount": 14000,
        "waterBill": 400,
        "gasBill": null,
        "otherBills": null
      },
      "rentedFrom": "2023-06-01",
      "vacatedAt": "2024-01-10T08:00:00.000Z",
      "notes": "Lease ended",
      "propertyId": "64f1a2b3c4d5e6f7a8b9c0d1",
      "propertyName": "Green View Apartments",
      "propertyAddress": "123 Main Street, Dhaka"
    }
  ]
}
```

---

### GET `/properties/:id/tenant-history`
Returns past tenants for a **single specific property**, sorted by most recently vacated first.

**Response `200`:** Same shape as above but without the `propertyId`, `propertyName`, `propertyAddress` fields (already scoped to the property).

---

## 🧾 Receipts — `/api/v1/receipts`

> All receipt routes require `Authorization: Bearer <accessToken>`. All receipts are scoped to the authenticated user.

---

### GET `/receipts`
Returns all receipts for the authenticated user. Supports search, filtering, sorting, and pagination via query parameters.

**Query parameters:**

| Param | Example | Description |
|-------|---------|-------------|
| `searchTerm` | `?searchTerm=Rahim` | Searches `tenantName`, `tenantPhone`, `propertyAddress` |
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=10` | Items per page (default: 10) |
| `sortBy` | `?sortBy=createdAt` | Field to sort by |
| `order` | `?order=desc` | Sort direction: `asc` or `desc` |

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Receipts retrieved successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d6",
      "userId": "64f1a2b3c4d5e6f7a8b9c0d2",
      "tenantName": "Rahim Uddin",
      "tenantPhone": "01812345678",
      "propertyId": "64f1a2b3c4d5e6f7a8b9c0d1",
      "unitId": "64f1a2b3c4d5e6f7a8b9c0d3",
      "propertyAddress": "123 Main Street, Dhaka, Flat 3A",
      "rentAmount": 15000,
      "monthYear": "2024-01",
      "paymentDate": "2024-01-05",
      "paymentMethod": "cash",
      "landlordName": "John Doe",
      "landlordPhone": "01712345678",
      "notes": "",
      "receiptLang": "en",
      "pdfUrl": "https://res.cloudinary.com/...",
      "createdAt": "2024-01-05T10:00:00.000Z",
      "updatedAt": "2024-01-05T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/receipts/:id`
Returns a single receipt by ID.

**Response `200`:** Same shape as a single item from the array above.

**Errors:**
- `404` — Receipt not found or does not belong to the user

---

### POST `/receipts/create-receipt`
Creates a new receipt and uploads the PDF to Cloudinary.

**Important:** This endpoint uses `multipart/form-data`, NOT `application/json`.

**How to send from frontend:**
```js
const formData = new FormData();
formData.append('pdf', pdfFile);           // the PDF file (File object)
formData.append('tenantName', 'Rahim Uddin');
formData.append('tenantPhone', '01812345678');
formData.append('propertyId', '64f1a2b3c4d5e6f7a8b9c0d1');
formData.append('unitId', '64f1a2b3c4d5e6f7a8b9c0d3');  // optional
formData.append('rentAmount', '15000');
formData.append('monthYear', '2024-01');
formData.append('paymentDate', '2024-01-05');
formData.append('paymentMethod', 'cash');
formData.append('notes', 'Paid on time');   // optional
formData.append('receiptLang', 'en');       // optional, default: 'en'
```

| Field | Type | Rules |
|-------|------|-------|
| `pdf` | File | Required. Must be `application/pdf` |
| `tenantName` | string | Required. Max 100 characters |
| `tenantPhone` | string | Required |
| `propertyId` | string | Required. Must be a property you own |
| `unitId` | string | Optional. Unit within the property |
| `rentAmount` | number | Required. Min 0 |
| `monthYear` | string | Required. Format: `"YYYY-MM"` e.g. `"2024-01"` |
| `paymentDate` | string | Required. Format: `"YYYY-MM-DD"` e.g. `"2024-01-05"` |
| `paymentMethod` | string | Required. One of: `"cash"`, `"bank_transfer"`, `"mobile_banking"` |
| `notes` | string | Optional. Max 500 characters |
| `receiptLang` | string | Optional. `"en"` or `"bn"`. Default: `"en"` |

**Server-side auto-resolved fields (do NOT send these):**
- `landlordName` — resolved from your user profile (`/auth/me`)
- `landlordPhone` — resolved from your user profile
- `propertyAddress` — resolved from the property. If `unitId` is provided, format is `"address, unitName"`. Otherwise just `"address"`

**Response `201`:** Full receipt object (same shape as GET).

---

### DELETE `/receipts/delete-receipt/:id`
Permanently deletes a receipt. The PDF on Cloudinary is **not** deleted.

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Receipt deleted successfully"
}
```

---

### GET `/receipts/:id/download-pdf`
Streams the PDF file directly to the browser as a download.

**Important:** This does NOT return JSON. It streams binary PDF data with headers:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt-Rahim-Uddin-2024-01.pdf"
```

**How to handle on frontend:**
```js
const response = await fetch(`/api/v1/receipts/${id}/download-pdf`, {
  headers: { Authorization: `Bearer ${accessToken}` }
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'receipt.pdf';
a.click();
URL.revokeObjectURL(url);
```

**Errors:**
- `404` — Receipt not found
- `404` — PDF not yet available for this receipt

---

## 🗺️ Route Summary

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/send-otp` | Public | Step 1 — send OTP to WhatsApp |
| POST | `/auth/verify-otp` | Public | Step 2 — verify OTP, get otpToken |
| POST | `/auth/register` | Public | Step 3 — register with otpToken |
| POST | `/auth/login` | Public | Login with phone + password |
| GET | `/auth/me` | Protected | Get current user profile |
| POST | `/auth/logout` | Protected | Logout, invalidate refresh token |
| POST | `/auth/change-password` | Protected | Change password with OTP verification |

### Properties
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/properties` | Protected | Get all properties |
| GET | `/properties/vacancy-summary` | Protected | Get vacancy stats |
| GET | `/properties/tenant-history` | Protected | Get all past tenants |
| GET | `/properties/:id` | Protected | Get single property |
| POST | `/properties/create-property` | Protected | Create property |
| PATCH | `/properties/update-property/:id` | Protected | Update property |
| DELETE | `/properties/delete-property/:id` | Protected | Delete property |
| POST | `/properties/:id/add-unit` | Protected | Add unit to property |
| PATCH | `/properties/:id/update-unit/:unitId` | Protected | Rename unit |
| DELETE | `/properties/:id/delete-unit/:unitId` | Protected | Delete unit |
| PUT | `/properties/:id/units/:unitId/assign-tenant` | Protected | Assign tenant to unit |
| DELETE | `/properties/:id/units/:unitId/clear-tenant` | Protected | Remove tenant → saves to history |
| GET | `/properties/:id/tenant-history` | Protected | Get past tenants for one property |

### Receipts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/receipts` | Protected | Get all receipts (searchable, paginated) |
| GET | `/receipts/:id` | Protected | Get single receipt |
| POST | `/receipts/create-receipt` | Protected | Create receipt + upload PDF |
| DELETE | `/receipts/delete-receipt/:id` | Protected | Delete receipt |
| GET | `/receipts/:id/download-pdf` | Protected | Stream PDF download |

---

## Redux Slice → API Mapping

| Slice | API Prefix | Notes |
|-------|-----------|-------|
| `authSlice` | `/api/v1/auth` | Store `accessToken`, `refreshToken`, `user` |
| `propertySlice` | `/api/v1/properties` | Store properties array, vacancy summary |
| `rentSlice` | `/api/v1/receipts` | Store receipts array with pagination meta |
| `languageSlice` | Client-side only | No API |
| `themeSlice` | Client-side only | No API |

---

## Error Handling Pattern

On any `401` response, the access token has expired. The current backend does not have a refresh token endpoint — redirect the user to `/login`.

On `409` during `send-otp` with `purpose: "register"` — the phone is already registered. Show "Phone already registered. Please login."

On `429` during `verify-otp` — too many failed attempts. Show "Too many attempts. Please request a new OTP." and re-trigger `send-otp`.

---

## Backend Tech Stack

| Tool | Purpose |
|------|---------|
| Express.js + TypeScript | HTTP framework |
| MongoDB + Mongoose | Database |
| Zod | Request validation |
| bcrypt | Password + OTP hashing |
| jsonwebtoken | Access, refresh, and OTP tokens |
| Twilio / Meta Cloud API | WhatsApp OTP delivery |
| Multer + Cloudinary | PDF upload and storage |
| axios | WhatsApp API HTTP calls |
