# StaffSync Backend API (FastAPI)

Oct 18, 2026 · @Raims Pires

## 1. Architecture overview

The backend is a single FastAPI application (a modular monolith) backed by PostgreSQL with PostGIS for geofences, Redis for cache, rate limits and real-time fan-out, and a worker process for background jobs. It serves both the admin dashboard and the mobile app through one versioned REST API, `/api/v1`.

### Components

| Component | Role |
| --- | --- |
| API service (FastAPI + Uvicorn) | REST endpoints, WebSocket for live updates, validation, auth |
| PostgreSQL 16 + PostGIS | All business data; geofences stored as geography polygons, point-in-polygon checks in SQL |
| Redis | Cache (permissions, settings), rate limiting, refresh-token denylist, pub/sub for live board, job broker |
| Worker (ARQ or Celery) | Notifications, reports, auto check-out, absence detection, CSV imports, webhooks |
| Scheduler | Periodic jobs: mark absences after grace period, missing check-outs, scheduled reports, leave accruals |
| Object storage (S3-compatible) | Selfies, leave attachments, logos, exports, accessed through presigned URLs |
| Push / SMS / Email providers | FCM/APNs for push, an SMS gateway for OTP and invites, SMTP or a transactional email API |

### Layers inside the API

Each request goes through the same path:

1. **Router** (`api/v1/...`): declares the endpoint, request and response schemas, and dependencies.
2. **Dependencies**: authenticate the user, resolve the tenant, load permissions and scope, open the DB session.
3. **Service** (use case): business rules, for example the check-in verification pipeline or leave approval.
4. **Repository**: all SQL, always filtered by tenant and scope.
5. **Domain events**: after commit, events such as `CheckInFlagged` or `LeaveApproved` trigger notifications, audit entries and real-time pushes.

Routers never touch the database directly, and services never know about HTTP.

## 2. Tech stack and libraries

The stack favours async I/O end to end, typed models, and maintained libraries. Python 3.12+.

| Concern | Library | Why |
| --- | --- | --- |
| Web framework | FastAPI, Uvicorn (Gunicorn with Uvicorn workers in production) | Async, OpenAPI docs, dependency injection |
| Validation / settings | Pydantic v2, pydantic-settings | Request/response schemas, typed env config |
| ORM / DB driver | SQLAlchemy 2.0 (async), asyncpg | Typed models, async sessions, unit of work |
| Migrations | Alembic | Versioned schema changes |
| Geospatial | PostGIS, GeoAlchemy2, Shapely | Geofence storage, ST\_Covers / ST\_Distance, polygon validation |
| Auth tokens | PyJWT | Access and refresh JWTs |
| Password hashing | argon2-cffi (via pwdlib) | Argon2id hashing |
| 2FA | pyotp | TOTP codes for admin 2FA |
| SSO | Authlib | Google and Microsoft OAuth / OIDC |
| Rate limiting | slowapi (Redis backend) | Per-IP and per-user limits |
| Cache / pub-sub | redis-py (asyncio) | Cache, denylist, live board fan-out |
| Background jobs | ARQ (async, Redis) or Celery + Celery Beat | Notifications, reports, periodic jobs |
| Files | boto3 / aioboto3, python-multipart, python-magic | S3 uploads, presigned URLs, MIME sniffing |
| Images | Pillow | Resize selfies, strip EXIF |
| Push notifications | firebase-admin | FCM for Android and iOS |
| Email | fastapi-mail or provider SDK, Jinja2 templates | Invites, resets, reports |
| SMS | Provider SDK (Twilio, Africa's Talking, etc.) | OTP and invites |
| QR codes | qrcode / segno | Site QR and employee badges |
| Exports | openpyxl, WeasyPrint or ReportLab, csv | Excel and PDF reports |
| Phone numbers | phonenumbers | Validate and normalise to E.164 |
| i18n | Babel | Translated emails, SMS and error messages (EN/FR) |
| Logging | structlog | JSON structured logs with request IDs |
| Errors / tracing | sentry-sdk, OpenTelemetry | Error tracking, distributed traces |
| Metrics | prometheus-fastapi-instrumentator | Request metrics |
| Testing | pytest, pytest-asyncio, httpx, factory-boy, testcontainers, freezegun | Unit and integration tests |
| Quality | Ruff, mypy, pre-commit, Bandit, pip-audit | Lint, types, security scans |

## 3. Project structure and design patterns

Code is organised by business module, each with the same four files, so a feature lives in one folder.

```text
app/
  main.py                 # app factory, middleware, routers
  core/                   # config, security, db session, redis, logging, errors, i18n
  common/                 # base repository, pagination, schemas, enums, utils
  modules/
    auth/  companies/  branches/  sites/  employees/  devices/
    schedules/  attendance/  alerts/  corrections/  leave/
    users_roles/  reports/  audit/  notifications/  settings/
    billing/  webhooks/  realtime/
      router.py           # endpoints
      schemas.py          # Pydantic request/response models
      service.py          # use cases, business rules
      repository.py       # SQLAlchemy queries
      models.py           # ORM tables
      events.py           # domain events emitted by the module
  workers/                # job definitions and periodic tasks
  migrations/             # Alembic
tests/
```

### Patterns used

| Pattern | Where | Purpose |
| --- | --- | --- |
| Layered / clean architecture | Router → service → repository | Business rules testable without HTTP or DB |
| Repository | `repository.py` per module | One place for SQL; tenant and scope filters applied automatically by a base repository |
| Unit of Work | One DB session per request, committed in a dependency | All changes of a request succeed or fail together |
| Dependency injection | FastAPI `Depends` | Current user, tenant, permissions, session and services injected and mockable |
| Strategy | Check-in verifiers (geofence, mock location, accuracy, device, schedule, selfie, QR) | Each rule is a class; sites enable a subset |
| Chain of responsibility / pipeline | Check-in verification | Runs verifiers in order and collects flags instead of stopping at the first |
| State machine | Leave requests, correction requests, alerts | Only allowed transitions (Pending → Approved, etc.); invalid moves rejected |
| Domain events + Observer | `events.py`, event bus | Decouple side effects: audit, notifications, live updates, webhooks |
| Transactional outbox | `outbox` table, worker relay | Events are saved in the same transaction and published reliably after commit |
| Specification / policy objects | Permission and scope checks | Reusable rules such as `CanApproveLeave(scope)` |
| Factory | Notification channels (push, SMS, email), export formats | Pick an implementation from settings |
| Adapter | SMS, email, push, storage providers | Swap vendors without touching services |
| DTO | Pydantic schemas | ORM models never leak to clients |
| Idempotency key | Check-in, offline sync, payments | Safe retries from flaky mobile networks |

## 4. Data model

Every business table carries `company_id` (the tenant), UUID primary keys, `created_at`, `updated_at` and, where records must stay for history, `deleted_at` for soft delete.

| Table | Key columns | Relations |
| --- | --- | --- |
| companies | name, logo\_url, country, timezone, locale, plan, status | has branches, users, settings |
| branches | name, code, address, timezone, holiday\_calendar\_id | company; has sites |
| sites | name, code, address, location (geography Point), geofence (geography Polygon), radius\_m, timezone, require\_selfie, require\_qr, device\_binding, allow\_offline, min\_accuracy\_m, qr\_secret, status | branch; managers, employees |
| users | email, phone (E.164), password\_hash, totp\_secret (encrypted), locale, status, last\_login\_at | one user per person; employee profile optional |
| employees | user\_id, employee\_no, branch\_id, job\_title, has\_smartphone, pin\_hash, badge\_token, start\_date, status | sites via employee\_sites |
| employee\_sites | employee\_id, site\_id, is\_default | many-to-many |
| site\_managers | user\_id, site\_id | many-to-many |
| devices | employee\_id, device\_id\_hash, platform, model, app\_version, push\_token, attestation\_status, registered\_at, revoked\_at | one active device per employee |
| roles | name, is\_system, description | company |
| role\_permissions | role\_id, permission (enum) |  |
| user\_roles | user\_id, role\_id, scope\_type (company / branches / branch\_own / sites / site\_own / self), scope\_ids\[\] |  |
| schedules | type (recurring / intervention), site\_id, title, days\_of\_week, start\_time, end\_time, crosses\_midnight, break\_min, grace\_min, early\_leave\_tol\_min, valid\_from, valid\_to, rotation, status (draft / published) | assignees via schedule\_assignments |
| shifts | employee\_id, site\_id, schedule\_id, starts\_at, ends\_at (UTC), status | materialised occurrences for the next N weeks |
| attendance\_records | employee\_id, site\_id, shift\_id, check\_in\_at, check\_out\_at, in\_point, out\_point, in\_accuracy\_m, distance\_m, method (self / proxy / admin / qr / manual), actor\_user\_id, status, flags\[\], selfie\_keys\[\], offline\_synced, client\_event\_id, notes | shift, employee, site |
| alerts | type, record\_id, reasons\[\], severity, status (open / approved / rejected), resolved\_by, resolution\_note | attendance\_records |
| correction\_requests | record\_id, kind, proposed\_in, proposed\_out, comment, attachment\_key, status |  |
| leave\_types | name, color, paid, yearly\_allowance, requires\_document, min\_notice\_days, half\_day\_allowed, carry\_over\_max |  |
| leave\_balances | employee\_id, leave\_type\_id, year, entitled, used, pending, adjusted |  |
| leave\_requests | employee\_id, leave\_type\_id, start\_date, end\_date, start\_half, end\_half, days, reason, attachment\_keys\[\], status, current\_step | approvals in leave\_approvals |
| leave\_approvals | request\_id, step, actor\_user\_id, decision, comment, decided\_at |  |
| holidays | calendar\_id, date, name |  |
| notifications | user\_id, type, payload, read\_at |  |
| audit\_logs | actor\_user\_id, action, target\_type, target\_id, before, after, reason, ip, user\_agent | append-only |
| outbox\_events | event\_type, payload, status, attempts | relayed by worker |
| webhooks / webhook\_deliveries | url, events\[\], secret / status, response\_code |  |
| refresh\_tokens | user\_id, family\_id, token\_hash, expires\_at, revoked\_at, device | rotation |

**Key indexes**: GiST on `sites.geofence`; `attendance_records (company_id, site_id, check_in_at)`; `shifts (employee_id, starts_at)`; a unique index on `attendance_records (employee_id, client_event_id)` for idempotent check-ins; `leave_requests (company_id, status)`.

**Tenant isolation**: PostgreSQL Row-Level Security policies on `company_id`, with the tenant set per transaction (`SET LOCAL app.company_id`), as a second guard behind the repository filters.

### Soft delete and data retention

Business records are never physically removed by a normal delete: they get `deleted_at`, `deleted_by` and `delete_reason`, disappear from the app, and can be restored. Only short-lived technical data is hard-deleted, and personal data is permanently erased only through a controlled retention job.

| Table | On delete | Restorable | Notes |
| --- | --- | --- | --- |
| employees | Soft delete (after deactivation) | Yes | History kept; sessions and device revoked; future shifts cancelled |
| sites | Soft delete (after deactivation) | Yes | Past attendance keeps referencing the site; QR secret invalidated |
| branches | Soft delete (after archive) | Yes | Blocked while active sites or employees remain |
| schedules | Soft delete | Yes | Future shifts cancelled; past shifts kept |
| shifts | Status `cancelled` | Via schedule | Never deleted, they explain past attendance |
| attendance\_records | Soft delete (reason required) | Yes | Always audited; excluded from reports unless asked |
| alerts, correction\_requests, leave\_requests | Never deleted | No | Closed by status (resolved, cancelled) |
| leave\_types, roles, holidays | Soft delete | Yes | Blocked while in use (roles assigned, types with balances) |
| users (dashboard access) | Revoke access; soft delete | Yes | Email freed for reuse |
| audit\_logs | Never deleted | No | Append-only; only purged by company retention policy |
| otp codes, refresh\_tokens, ws tickets, notifications, outbox\_events, export files | Hard delete | No | Expire automatically via retention job |

### How it is implemented

- **Mixin**: a `SoftDeleteMixin` adds `deleted_at` (timestamptz, nullable), `deleted_by` (user id) and `delete_reason` to the models above.
- **Automatic filtering**: a SQLAlchemy `do_orm_execute` event applies `with_loader_criteria(SoftDeleteMixin, lambda cls: cls.deleted_at.is_(None))` to every query, including relationships. Repositories opt out explicitly with `execution_options(include_deleted=True)`, used only by restore, trash views, audit and reports that request it.
- **Delete in the service**: `service.soft_delete(ctx, id, reason)` checks permission and blocking rules, sets the three columns, runs side effects (revoke sessions, cancel future shifts), writes the audit entry and emits a `<Entity>Deleted` event, all in one transaction.
- **Restore**: clears the columns after re-checking constraints (for example a restored employee whose employee number was reused gets a 409 asking to change it). Emits `<Entity>Restored` and writes an audit entry.
- **Unique constraints** become partial indexes so codes can be reused: `UNIQUE (company_id, employee_no) WHERE deleted_at IS NULL`, same for site codes, branch codes, role names and user emails per company.
- **Hot indexes** are partial on `deleted_at IS NULL` (live board, shifts, attendance by site) so deleted rows don't slow queries.
- **Foreign keys** use `ON DELETE RESTRICT`; since rows are never physically deleted during normal use, references from attendance to deleted employees or sites stay valid and display as "(deleted)".
- **Row-Level Security** stays on `company_id` only; soft-delete filtering is an application concern so admins with the right permission can still see trash.

### Endpoints

Every `DELETE` on the tables above is a soft delete and requires a `reason` in the body. List endpoints accept `?include_deleted=true` or `?only_deleted=true` for users with the matching manage permission.

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| DELETE | /employees/{id} | employees.manage | Soft delete (must be deactivated first) |
| POST | /employees/{id}/restore | employees.manage | Restore |
| DELETE | /sites/{id} | sites.manage | Soft delete (must be deactivated first) |
| POST | /sites/{id}/restore | sites.manage | Restore |
| DELETE | /branches/{id} | branches.manage | Soft delete (must be archived first) |
| POST | /branches/{id}/restore | branches.manage | Restore |
| POST | /schedules/{id}/restore | schedules.manage | Restore and regenerate future shifts |
| POST | /attendance/{id}/restore | attendance.edit | Restore a deleted record |
| POST | /roles/{id}/restore | roles.manage | Restore |
| POST | /leave/types/{id}/restore | leave.settings | Restore |
| GET | /trash | settings.manage | All soft-deleted items in scope, filterable by type and date |

### Retention and permanent erasure

- **Trash period**: soft-deleted items stay restorable for a company-configurable period (default 90 days). After that, a daily job anonymises them: personal fields (name, phone, email, photo, selfies, device data) are cleared or replaced, while attendance aggregates needed for payroll history are kept without identifying data.
- **Employee erasure request**: `POST /employees/{id}/erase` (owner permission, recent re-authentication) schedules immediate anonymisation, recorded in the audit log.
- **Company deletion**: `POST /company/delete` soft-deletes the tenant, blocks logins, and hard-deletes all its data after the grace period (for example 30 days), including storage objects. Backups age out on their normal rotation.
- **Technical data**: OTPs (minutes), WebSocket tickets (seconds), expired refresh tokens, read notifications older than 180 days, sent outbox events older than 30 days and export files older than 7 days are hard-deleted by the retention job.

## 5. Authentication and authorization

Admins sign in with email and password (plus TOTP 2FA or SSO); mobile users sign in with an OTP by SMS or email. Both get the same token pair, and every request is then checked for permission and scope.

### Tokens

- **Access token**: JWT signed with an asymmetric key (EdDSA or RS256), 15 minutes. Claims: `sub` (user id), `cid` (company id), `sid` (session id), `dev` (device id for mobile), `iat`, `exp`, `jti`. Permissions are not put in the token; they are loaded from Redis cache so role changes apply immediately.
- **Refresh token**: opaque random string, stored hashed, 30 days on mobile and 7 days on web. **Rotated on every use**; reusing an old one revokes the whole token family (theft detection).
- **Web**: refresh token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie, access token kept in memory, CSRF token for cookie-based calls.
- **Mobile**: tokens kept in the iOS Keychain / Android Keystore, bound to the registered device id.
- Key rotation through a `kid` header and a JWKS endpoint.

### Request dependencies

```python
@router.post("/leave-requests/{id}/approve")
async def approve(
    id: UUID,
    body: LeaveDecisionIn,
    ctx: RequestContext = Depends(require(Perm.LEAVE_APPROVE)),
    service: LeaveService = Depends(get_leave_service),
):
    return await service.approve(ctx, id, body)
```

- `get_current_user` validates the JWT, checks the session is not revoked and the user is active.
- `get_tenant` sets the company for the session and for Row-Level Security.
- `require(*perms)` loads the user's roles, checks the permission, and builds a `RequestContext` holding the user, company and **resolved scope** (the set of branch and site ids the user may act on).
- Repositories receive the context and always add `WHERE company_id = :cid AND site_id IN (:scope_sites)`. Fetching an object outside scope returns **404**, not 403, so ids of other branches are not revealed.

### Permission catalogue

`attendance.view`, `attendance.edit`, `attendance.proxy_checkin`, `alerts.view`, `alerts.resolve`, `employees.view`, `employees.manage`, `devices.reset`, `sites.view`, `sites.manage`, `branches.manage`, `schedules.view`, `schedules.manage`, `leave.view`, `leave.recommend`, `leave.approve`, `leave.settings`, `reports.view`, `reports.export`, `users.manage`, `roles.manage`, `audit.view`, `settings.manage`, `billing.manage`. Every employee implicitly has `self.*` on their own data.

### Mobile-specific checks

Check-in endpoints also require the token's device id to match the employee's active registered device, and accept an app attestation token (Play Integrity on Android, App Attest on iOS) that the backend verifies.

## 6. API conventions

All endpoints follow the same rules so the web and mobile clients can share one API client.

- **Base path and versioning**: `/api/v1`. Breaking changes go to `/api/v2`; the mobile app sends `X-App-Version` and the API can answer **426** to force an update.
- **Format**: JSON, `snake_case`, UUID ids, timestamps in ISO 8601 UTC. Each site and branch carries its timezone; clients convert for display.
- **Pagination**: cursor-based for long lists (`?cursor=…&limit=50`, response has `items` and `next_cursor`); offset allowed on small admin tables.
- **Filtering and sorting**: query parameters (`?site_id=…&status=late,absent&from=…&to=…&sort=-check_in_at`).
- **Errors**: RFC 9457 problem details:

```json
{
  "type": "https://api.staffsync.app/errors/outside-geofence",
  "title": "Outside site boundary",
  "status": 422,
  "code": "OUTSIDE_GEOFENCE",
  "detail": "You are 420 m from Site A.",
  "request_id": "01J9..."
}
```

- **Language**: `Accept-Language: en | fr` selects translated messages.
- **Idempotency**: write endpoints that the mobile app may retry accept `Idempotency-Key`; check-ins also carry a `client_event_id` generated on the phone. A repeated key returns the first response.
- **Optimistic locking**: editable resources return an `ETag`/`version`; updates send `If-Match` and get **409** on conflict.
- **Status codes**: 200, 201, 204, 400 validation, 401 unauthenticated, 403 forbidden action, 404 not found or out of scope, 409 conflict, 422 business rule, 429 rate limited.
- **Docs**: OpenAPI at `/api/v1/openapi.json`, Swagger UI only in non-production environments.

## 7. Endpoints: auth and account

All paths are under `/api/v1`. "Public" endpoints are rate limited per IP and per identifier.

| Method | Path | Access | What it does |
| --- | --- | --- | --- |
| POST | /auth/signup | Public | Create owner account + company (wizard step 1); sends email code |
| POST | /auth/verify-email | Public | Confirm the email code |
| POST | /auth/login | Public | Email + password; returns tokens or `mfa_required` with a short-lived MFA ticket |
| POST | /auth/mfa/verify | MFA ticket | Check TOTP or backup code, optionally trust device 30 days; returns tokens |
| POST | /auth/otp/request | Public | Mobile login: send a 6-digit code to phone or email |
| POST | /auth/otp/verify | Public | Check code; returns tokens and the list of companies if several |
| POST | /auth/select-company | Authenticated | Switch to another company; returns new tokens |
| GET | /auth/sso/{provider}/authorize | Public | Start Google / Microsoft SSO |
| GET | /auth/sso/{provider}/callback | Public | Finish SSO, issue tokens |
| POST | /auth/refresh | Refresh token | Rotate the refresh token, return a new access token |
| POST | /auth/logout | Authenticated | Revoke the current session |
| POST | /auth/password/forgot | Public | Email a single-use reset link (same response whether the email exists or not) |
| POST | /auth/password/reset | Reset token | Set a new password, revoke all sessions |
| POST | /invitations/{token}/accept | Invitation token | Accept an invite, set password |
| GET | /me | Authenticated | Profile, companies, roles, effective permissions and scope |
| PATCH | /me | Authenticated | Update name, locale, theme, notification preferences |
| POST | /me/password | Authenticated | Change password (current password required) |
| POST | /me/mfa/setup | Authenticated | Start TOTP enrolment (secret + QR) |
| POST | /me/mfa/enable | Authenticated | Confirm first code, return backup codes |
| DELETE | /me/mfa | Authenticated + recent auth | Disable 2FA |
| GET | /me/sessions | Authenticated | Active sessions |
| DELETE | /me/sessions/{id} | Authenticated | Sign out a session |

**OTP rules**: codes hashed in Redis, 5-minute expiry, 5 wrong attempts then a lock, resend after 60 seconds, and a daily cap per phone number to limit SMS cost and abuse.

## 8. Endpoints: company, branches, sites

Sites hold the geofence that every check-in is tested against, so site writes validate geometry before saving.

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /company | any admin | Company profile |
| PATCH | /company | settings.manage | Update profile, timezone, locale |
| POST | /company/logo | settings.manage | Upload logo (returns presigned URL flow) |
| GET | /company/onboarding | owner | Wizard progress and setup checklist |
| GET | /branches | branches.view (scoped) | List branches with counts |
| POST | /branches | branches.manage | Create branch |
| GET | /branches/{id} | scoped | Branch detail and stats |
| PATCH | /branches/{id} | branches.manage | Update |
| POST | /branches/{id}/archive | branches.manage | Archive; 409 if sites or employees remain |
| GET | /sites | sites.view (scoped) | List or map data; `?branch_id`, `?bbox=` for map viewport |
| POST | /sites | sites.manage | Create site with geofence |
| GET | /sites/{id} | scoped | Detail, managers, verification rules, stats |
| PATCH | /sites/{id} | sites.manage | Update; geofence change is audited |
| POST | /sites/{id}/deactivate | sites.manage | Stop accepting check-ins |
| GET | /sites/{id}/qr | sites.manage | Signed QR payload / printable PDF |
| POST | /sites/{id}/qr/rotate | sites.manage | Rotate QR secret (invalidates printed codes) |
| PUT | /sites/{id}/managers | sites.manage | Set site managers |
| PUT | /sites/{id}/employees | sites.manage | Set assigned employees |
| GET | /sites/{id}/overlaps | sites.manage | Sites whose geofence intersects this one |
| GET | /me/sites/nearby | employee | Mobile: assigned sites with geofence and distance from `?lat&lng` |

### Geofence handling

- The client sends either `{"type":"circle","center":[lng,lat],"radius_m":150}` or a GeoJSON Polygon.
- Circles are stored as their center + radius and also converted to a polygon (`ST_Buffer` on geography) so all checks use one query.
- Shapely validates polygons: closed ring, no self-intersection, at least 3 points, area within limits (for example 10 m² to 5 km²).
- Coordinates use WGS 84 (SRID 4326) and the `geography` type, so distances come back in meters.

## 9. Endpoints: employees and devices

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /employees | employees.view (scoped) | List with filters (branch, site, role, status, has\_smartphone, q) |
| POST | /employees | employees.manage | Create; checks plan limit; optional invite |
| GET | /employees/{id} | scoped | Profile with stats |
| PATCH | /employees/{id} | employees.manage | Update |
| POST | /employees/{id}/deactivate | employees.manage | Deactivate, revoke sessions and device |
| POST | /employees/{id}/invite | employees.manage | (Re)send app invite by SMS/email |
| POST | /employees/{id}/badge | employees.manage | Generate badge QR + new PIN (PIN shown once); returns printable PDF |
| POST | /employees/import | employees.manage | Upload CSV; returns an import job id |
| GET | /employees/import/{job\_id} | employees.manage | Preview, column mapping, row errors, status |
| POST | /employees/import/{job\_id}/commit | employees.manage | Run the import in the worker |
| GET | /employees/import/template | employees.manage | CSV template |
| GET | /employees/{id}/attendance | scoped | Records for the profile calendar |
| GET | /employees/{id}/activity | audit.view | Audit entries for this employee |
| POST | /devices/register | employee | Mobile: bind this phone (device id hash, platform, model, attestation) |
| PUT | /devices/me/push-token | employee | Update FCM/APNs token |
| GET | /employees/{id}/device | employees.view | Registered device info |
| POST | /employees/{id}/device/reset | devices.reset | Revoke binding so the employee can register a new phone |

**Device binding**: `/devices/register` succeeds only if the employee has no active device or the previous one was reset. The device id is hashed (SHA-256 with a server pepper) before storage.

## 10. Endpoints: schedules and interventions

Schedules are rules; the backend expands them into concrete `shifts` (one row per employee per occurrence, in UTC) for the next 8 weeks, so check-ins, absences and the planner query simple rows.

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /schedules | schedules.view (scoped) | List recurring schedules and interventions |
| POST | /schedules | schedules.manage | Create recurring schedule or intervention (draft) |
| GET | /schedules/{id} | scoped | Detail with assignees |
| PATCH | /schedules/{id} | schedules.manage | Update (draft or creates a new version) |
| DELETE | /schedules/{id} | schedules.manage | Delete draft, or end a published schedule from a date |
| POST | /schedules/validate | schedules.manage | Dry run: returns conflicts without saving |
| POST | /schedules/publish | schedules.manage | Publish drafts, regenerate shifts, optionally notify employees |
| POST | /schedules/copy-week | schedules.manage | Copy one week's shifts to another |
| GET | /shifts | schedules.view | Planner data: \`?from&to&group\_by=employee |
| PATCH | /shifts/{id} | schedules.manage | Move or resize one occurrence (exception) |
| GET | /me/shifts | employee | Mobile schedule: own shifts, leave and holidays |
| GET | /me/shifts/today | employee | Today's assignments for Home |

### How it works

- Times are stored in the site's local time on the schedule and converted to UTC for each shift, so daylight saving and night shifts crossing midnight are handled once.
- **Conflicts** detected on validate and publish: overlapping shifts for the same employee, shifts during approved leave or holidays, employee not assigned to the site. Returned as a list with codes.
- A nightly job extends the shift window and regenerates after edits; publishing triggers it immediately.

## 11. Endpoints: attendance and check-in

A check-in is never rejected for location reasons: the server re-verifies everything the phone claims, saves the record, and attaches flags when a rule fails. Only malformed or duplicate requests are refused.

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| POST | /attendance/check-in | employee (registered device) | Self check-in |
| POST | /attendance/check-out | employee (registered device) | Self check-out |
| POST | /attendance/sync | employee | Upload a batch of offline check-in/out events |
| POST | /attendance/proxy/check-in | attendance.proxy\_checkin | Site manager / admin checks in an employee (PIN or badge) |
| POST | /attendance/proxy/check-out | attendance.proxy\_checkin | Proxy check-out |
| POST | /uploads/selfie | employee | Get presigned upload URL for a selfie before check-in |
| GET | /me/attendance | employee | Own records `?month=` with summary |
| GET | /me/attendance/{id} | employee | Own record detail |
| GET | /attendance | attendance.view (scoped) | Admin records list with filters, cursor pagination |
| GET | /attendance/{id} | scoped | Detail with map points, timeline, history |
| POST | /attendance | attendance.edit | Manual record (reason required) |
| PATCH | /attendance/{id} | attendance.edit | Edit times/status (reason required, `If-Match`) |
| DELETE | /attendance/{id} | attendance.edit | Soft delete (reason required) |
| POST | /attendance/bulk | attendance.edit | Bulk mark absent / approve |
| GET | /attendance/live | attendance.view | Live board snapshot per site |
| GET | /attendance/export | reports.export | Filtered export (async job for large ranges) |
| GET | /dashboard/overview | attendance.view | KPIs, trend, punctuality, needs-attention counts |

### Check-in request

```json
POST /api/v1/attendance/check-in
Idempotency-Key: 6f1c...
{
  "client_event_id": "6f1c...",
  "site_id": "…",
  "lat": 4.0511, "lng": 9.7679, "accuracy_m": 12,
  "captured_at": "2026-10-19T06:56:03Z",
  "is_mock_location": false,
  "selfie_key": "uploads/…",
  "qr_payload": "…",
  "attestation_token": "…"
}
```

### Verification pipeline

The service runs every enabled verifier (Strategy classes chained in a pipeline) and collects reasons:

1. **Device**: token device id matches the active registered device; attestation token valid.
2. **Schedule**: a shift exists for this employee at this site around now (configurable window, for example 2 h before start). Otherwise `UNSCHEDULED`.
3. **Geofence**: `ST_Covers(site.geofence, point)` in PostGIS; distance via `ST_Distance`. Outside → `OUTSIDE_GEOFENCE` with meters.
4. **Accuracy**: `accuracy_m` above the site's minimum → `LOW_ACCURACY`.
5. **Mock location**: client flag or attestation verdict → `MOCK_LOCATION`.
6. **Time**: `captured_at` too far from server time (online) → `TIME_TAMPERED`. For offline sync, ordering and plausibility checks instead.
7. **Speed sanity**: compared with the employee's last known point, impossible travel speed → `IMPOSSIBLE_TRAVEL`.
8. **Selfie / QR** when the site requires them: QR payload is HMAC-signed with the site's secret and contains a time window; selfie key must exist and belong to this user.

Then, in one transaction: create the record (`status` = on time or late from the shift start and grace period), add `flags`, create an `alert` if any flag is set, write an outbox event (`CheckInRecorded`, `CheckInFlagged`). The response tells the app the status and any flags to display.

### Check-out

Same verifiers; computes worked hours minus break, early leave against tolerance, overtime past the end. A check-out without an open record returns 409.

### Offline sync

`/attendance/sync` takes up to 50 events sorted by `captured_at`. Each event is processed through the same pipeline, deduplicated by `client_event_id`, marked `offline_synced = true`, and flagged if it arrives after the company's maximum sync delay. The response returns a per-event result.

### Proxy check-in

Requires `attendance.proxy_checkin` in the site's scope. The manager's own location must be inside the geofence. The employee is identified by `badge_token` (QR) or employee id plus `pin`, checked against `pin_hash` with attempt limits (5 tries then 15-minute lock). The record stores `method = proxy` and `actor_user_id`, and an audit entry is written.

## 12. Endpoints: alerts and correction requests

Alerts and corrections are small state machines: each has a fixed set of statuses, and every transition is checked, audited and notified.

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /alerts | alerts.view (scoped) | \`?type=flagged |
| GET | /alerts/{id} | scoped | Evidence: map points, distance, accuracy, device, selfie URL (short-lived), employee comment, past flag count |
| POST | /alerts/{id}/approve | alerts.resolve | Mark check-in valid (reason) |
| POST | /alerts/{id}/reject | alerts.resolve | Record becomes absent/invalid (reason) |
| POST | /alerts/{id}/escalate | alerts.resolve | Assign to another admin |
| POST | /alerts/{id}/notes | alerts.view | Add note |
| POST | /alerts/bulk-resolve | alerts.resolve | Resolve several |
| POST | /me/attendance/{id}/comment | employee | Employee's comment on own flagged record |
| POST | /me/attendance/{id}/corrections | employee | Request correction (kind, proposed times, comment, attachment) |
| GET | /me/corrections | employee | Own correction requests |
| GET | /corrections | attendance.edit (scoped) | Pending correction requests |
| POST | /corrections/{id}/accept | attendance.edit | Apply proposed times to the record |
| POST | /corrections/{id}/decline | attendance.edit | Decline with reason |

**Alert states**: `open → approved | rejected`, `open → escalated → approved | rejected`. **Correction states**: `pending → accepted | declined | cancelled`. A transition not allowed from the current state returns 409.

## 13. Endpoints: leave

Leave requests move through a state machine with one or two approval steps; balances change in the same transaction as each decision so they never drift.

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /me/leave/balances | employee | Balances per type for `?year=` |
| POST | /me/leave/requests/preview | employee | Day count (excluding weekends/holidays per policy), balance after, warnings (overlap, notice, exceeds) |
| POST | /uploads/leave-attachment | employee | Presigned upload URL |
| POST | /me/leave/requests | employee | Submit request |
| GET | /me/leave/requests | employee | Own requests |
| GET | /me/leave/requests/{id} | employee | Detail with approval timeline |
| PATCH | /me/leave/requests/{id} | employee | Edit while pending or changes requested |
| POST | /me/leave/requests/{id}/cancel | employee | Cancel pending, or ask to cancel approved |
| GET | /leave/requests | leave.view (scoped) | Inbox `?status&type&site_id&waiting_on_me=true` |
| GET | /leave/requests/{id} | scoped | Detail + balance + coverage check |
| GET | /leave/requests/{id}/coverage | scoped | Colleagues off on those dates, affected shifts and interventions |
| POST | /leave/requests/{id}/recommend | leave.recommend | Site manager step 1: recommend approve/reject |
| POST | /leave/requests/{id}/approve | leave.approve | Final approval |
| POST | /leave/requests/{id}/reject | leave.approve | Reject (reason required) |
| POST | /leave/requests/{id}/request-changes | leave.approve | Send back with comment |
| POST | /leave/requests/{id}/cancel | leave.approve | Cancel approved leave (reason) |
| POST | /leave/requests/bulk | leave.approve | Bulk approve/reject |
| GET | /leave/calendar | leave.view | Calendar data `?from&to&group_by` |
| GET | /leave/balances | leave.view | Balances table |
| POST | /leave/balances/{id}/adjust | leave.settings | +/- days with reason |
| GET / POST / PATCH | /leave/types | leave.settings | Manage leave types |
| GET / POST / DELETE | /holidays | leave.settings | Holiday calendars per branch |

### State machine

`pending → recommended → approved | rejected | changes_requested`; `changes_requested → pending` (resubmit); `pending → cancelled`; `approved → cancellation_requested → cancelled`. With one-level approval the `recommended` step is skipped.

### Side effects of approval (one transaction + outbox)

- Move days from `pending` to `used` in `leave_balances` (row locked with `SELECT … FOR UPDATE`).
- Mark affected shifts `on_leave`; unassign the employee from interventions in that range and create `uncovered_intervention` alerts.
- Emit `LeaveApproved` → push notification to the employee, audit entry, webhook.

## 14. Endpoints: users, roles, reports, audit, notifications, settings, billing, webhooks, real-time

### Users and roles

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /users | users.manage | Dashboard users with role and scope |
| POST | /users/invite | users.manage | Invite with role + scope |
| PATCH | /users/{id}/roles | users.manage | Change roles/scope (cannot grant more than you hold) |
| POST | /users/{id}/revoke | users.manage | Remove access, revoke sessions |
| GET | /roles | roles.manage | Roles with user counts |
| POST | /roles | roles.manage | Create custom role |
| PATCH | /roles/{id} | roles.manage | Edit permissions; system roles locked |
| DELETE | /roles/{id} | roles.manage | 409 if assigned |
| GET | /permissions | roles.manage | Permission catalogue for the matrix |
| POST | /roles/preview | roles.manage | What a permission + scope set would see |

### Reports and audit

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /reports/types | reports.view | Available reports and options |
| POST | /reports/preview | reports.view | Chart + table data for a definition |
| POST | /reports/exports | reports.export | Start an export job (csv / xlsx / pdf) |
| GET | /reports/exports/{id} | reports.export | Status and short-lived download URL |
| GET / POST / PATCH / DELETE | /reports/saved | reports.view | Saved reports and email schedules |
| GET | /audit-logs | audit.view | Filtered, cursor paginated, read-only |
| GET | /audit-logs/export | audit.view + reports.export | Export |

### Notifications and settings

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /me/notifications | authenticated | List `?unread=true` |
| POST | /me/notifications/read | authenticated | Mark ids or all as read |
| DELETE | /me/notifications/{id} | authenticated | Delete |
| GET / PATCH | /settings/attendance | settings.manage | Grace periods, accuracy, offline, auto check-out, overtime |
| GET / PATCH | /settings/leave-policy | leave.settings | Approval levels, carry-over, accrual |
| GET / PATCH | /settings/notifications | settings.manage | Event × channel × role matrix |
| GET / POST / DELETE | /settings/api-keys | settings.manage | API keys (shown once, stored hashed) |
| POST | /company/export | owner | Full data export job |
| POST | /company/delete | owner + recent auth | Schedule deletion after grace period |

### Billing

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET | /billing | billing.manage | Plan, usage, limits |
| POST | /billing/checkout | billing.manage | Start upgrade with the payment provider (card or mobile money) |
| GET | /billing/invoices | billing.manage | Invoices |
| POST | /billing/webhook | provider signature | Payment provider callbacks (signature verified, idempotent) |

### Webhooks for integrations

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| GET / POST / PATCH / DELETE | /webhooks | settings.manage | Endpoints subscribed to events (`attendance.checked_in`, `attendance.flagged`, `leave.approved`…) |
| GET | /webhooks/{id}/deliveries | settings.manage | Delivery log, retry |

Outgoing payloads are signed with HMAC-SHA256 (`X-StaffSync-Signature` with a timestamp) and retried with exponential backoff.

### Real-time

| Method | Path | Permission | What it does |
| --- | --- | --- | --- |
| WS | /ws?ticket=… | attendance.view | Live board and dashboard events |
| POST | /ws/ticket | attendance.view | Single-use, 30-second ticket for opening the WebSocket (avoids tokens in URLs) |

The server subscribes the socket only to Redis channels for sites in the user's scope (`company:{id}:site:{id}`) and pushes `checkin`, `checkout`, `flag` and `leave` events.

### Health

`GET /health/live` and `GET /health/ready` (checks DB and Redis), unauthenticated, no data returned.

## 15. Background jobs, notifications and real-time

Anything slow or time-based runs in the worker, so API responses stay fast and work survives restarts.

| Job | Trigger | What it does |
| --- | --- | --- |
| Outbox relay | Every few seconds | Publishes saved domain events to handlers, Redis pub/sub and webhooks; marks them sent |
| Absence detection | Every 5 min | Shifts past start + grace with no check-in → `Absent` (unless on leave/holiday); alert admins per notification rules |
| Missing check-out | Every 15 min | Open records past shift end + margin → reminder push, then `Missing check-out` alert; optional auto check-out at company time |
| Shift reminders | Every 5 min | Push before shift start (employee preference) |
| Shift generation | Nightly + on publish | Extend shifts 8 weeks ahead |
| Leave accrual / year-end | Monthly / yearly | Accrue days, apply carry-over limits |
| Scheduled reports | Per saved schedule | Build file, email recipients |
| CSV import | On commit | Create employees in batches, report errors |
| Notification dispatch | On event | Fan out to in-app, push (FCM), SMS, email via channel factory; retries with backoff; dead tokens removed |
| Webhook delivery | On event | Signed POST, retries, delivery log |
| Data retention | Daily | Purge expired selfies (e.g. 90 days), old OTPs, expired exports |

### Notification flow

1. A service emits a domain event (for example `LeaveApproved`) into the outbox.
2. The relay hands it to the notification handler, which reads the company's notification rules to find recipients by role and scope.
3. For each recipient and channel, a message is rendered in their language (Babel + Jinja2 templates) and sent through the channel adapter.
4. An in-app `notifications` row is always created so the bell and the mobile list stay consistent.

### Real-time flow

After a check-in commits, the event is published to `company:{cid}:site:{sid}`. Each API instance holds the WebSocket connections of its users and forwards messages from the channels they're scoped to. Multiple API instances work because Redis carries the fan-out.

## 16. Security measures

The two biggest risks are one company seeing another's data and employees faking attendance; the measures below cover both, plus standard API hardening (OWASP API Top 10).

| Area | Measures |
| --- | --- |
| Tenant isolation | `company_id` filter in the base repository, Postgres Row-Level Security as backstop, out-of-scope ids return 404, automated tests that try cross-tenant access on every endpoint |
| Authorization | Permission + scope check on every route via dependencies; object-level checks in services (BOLA protection); users cannot grant roles above their own; sensitive actions need recent re-authentication |
| Authentication | Argon2id password hashing, password strength and breached-password check, TOTP 2FA for admins (enforceable per company), short-lived JWTs, rotating refresh tokens with reuse detection, session revocation on password change or deactivation |
| Brute force and abuse | slowapi rate limits on login, OTP, PIN, check-in and exports; lockouts on OTP/PIN; per-phone SMS daily caps; generic responses on forgot password and login |
| Attendance fraud | Server-side geofence check (client result never trusted), mock-location and attestation (Play Integrity / App Attest), device binding, signed and rotating site QR codes, optional selfie, impossible-travel and time checks, flags instead of silent acceptance |
| Input validation | Pydantic strict models, max lengths, enums, coordinate ranges, geometry validation, no raw SQL string building (SQLAlchemy parameters) |
| File uploads | Presigned URLs with size and content-type limits, MIME sniffing, image re-encoding with Pillow (strips EXIF and payloads), private buckets, short-lived download URLs, optional antivirus scan |
| Data protection | TLS 1.2+ everywhere, HSTS; encryption at rest for DB and storage; TOTP secrets and provider keys encrypted with a KMS-managed key; PINs and device ids hashed; secrets from env/secret manager, never in code |
| Privacy | Location captured only at check-in/out (no background tracking), data minimisation, selfie retention limit, employee data export and deletion on request, consent text in the app |
| Web security | Strict CORS allow-list, CSRF tokens for cookie auth, security headers (CSP, X-Content-Type-Options, frame-ancestors), no stack traces in responses |
| Auditability | Append-only audit log for every sensitive action (edits, proxy check-ins, decisions, role changes, settings), request IDs in logs, logs scrubbed of tokens, PINs and OTPs |
| Webhooks and payments | HMAC signatures with timestamps (replay protection), idempotent processing, outbound URL validation to prevent SSRF |
| Dependencies and code | pip-audit and Dependabot, Bandit, Ruff, mypy, container image scanning, least-privilege DB user for the app |
| Operations | Backups with point-in-time recovery and restore tests, alerts on error spikes and auth anomalies, separate environments and credentials |

## 17. Testing, observability and deployment

### Testing

- **Unit tests** for services and verifiers with fake repositories (each check-in rule, leave state machine, balance math, schedule expansion across DST and midnight).
- **Integration tests** with testcontainers (real PostgreSQL + PostGIS and Redis): geofence queries, RLS isolation, idempotent check-in, offline sync ordering.
- **API tests** with httpx `AsyncClient`: auth flows, permission matrix (every endpoint × role × scope), cross-tenant access attempts.
- freezegun for time-dependent jobs; factory-boy for test data. Target 80%+ coverage on services.

### Observability

- structlog JSON logs with `request_id`, `company_id`, `user_id` (never tokens or PINs).
- Sentry for errors, OpenTelemetry traces across API, DB and worker.
- Prometheus metrics: request latency, check-ins per minute, flag rate, job queue length, notification failures; Grafana dashboards and alerts.

### Deployment

- Docker images for API and worker; Gunicorn with Uvicorn workers behind a reverse proxy or load balancer (TLS termination).
- Managed PostgreSQL with PostGIS and point-in-time recovery, managed Redis, S3-compatible storage.
- CI (GitHub Actions): lint, type check, security scans, tests, build image; Alembic migrations run as a separate release step before rollout.
- Environments: dev, staging, production, each with its own secrets and data.
- Horizontal scaling: stateless API instances; WebSocket fan-out through Redis; workers scaled by queue length.
