# CITEMAS Backend Logic Summary (Last 24 Hours)

## Overview
The backend work focused on stabilizing the auth system, enforcing identity validation, and making role-based access consistent across the portal. The project now uses a stricter server-side flow for registration, login, profile updates, and application handling.

## 1) Authentication and Session Logic
### Implemented
- JWT-based authentication is issued on successful login and validated on protected routes.
- Server-side auth checks are used as the trust source; the app no longer treats client-side local storage as the authoritative session state.
- Auth state is refreshed on demand to reduce stale user-role drift.
- Provider guards were added so authentication logic is initialized safely and does not crash when the app boots without a valid token.

### Security intent
- Prevent stale localStorage data from showing an outdated role or profile state.
- Protect protected routes from unauthorized access.
- Keep auth state synchronized with the server instead of trusting a stale frontend cache.

### Files involved
- [lib/auth.js](lib/auth.js)
- [lib/AuthContext.js](lib/AuthContext.js)
- [app/api/auth/login/route.js](app/api/auth/login/route.js)
- [app/api/auth/register/route.js](app/api/auth/register/route.js)

## 2) Role Model and Access Control
### Core roles
- `super_admin`
- `teacher`
- `officer`
- `member`
- `alumni`
- `applicant`

### Behavior
- Staff/admin-only actions are restricted to `super_admin`, `teacher`, and `officer` roles.
- Role-based checks are enforced in user and application APIs.
- Officer/teacher/admin visibility and dashboard access are narrowed to the proper audience.
- The portal no longer exposes admin-only controls to regular members.

### Files involved
- [models/User.js](models/User.js)
- [app/api/users/route.js](app/api/users/route.js)
- [app/api/users/[id]/route.js](app/api/users/[id]/route.js)
- [app/api/applications/route.js](app/api/applications/route.js)
- [app/api/applications/[id]/route.js](app/api/applications/[id]/route.js)

## 3) Registration Validation Rules
### Implemented
- Registration payloads are validated with Zod before saving users.
- Required identity fields include first name, last name, email, password, student ID, year level, department, and specialization.
- Student-specific email validation was tightened to enforce the school domain pattern.
- ID validation rules were standardized around university format expectations.

### Required rules
- Student emails must use the academic domain: `@phinmaed.com`.
- Student IDs should follow a strict structure, e.g. `04-2122-033338`.
- Teacher/adviser entries use a distinct ID format and should be recognized separately from student IDs.

### Planned/next step
- Add explicit `student`, `teacher`, and `adviser` registration paths.
- Add separate validation schemas for each classification.
- Add a password reset / forgot-password path using Google Identity or email-based reset flow.

### Files involved
- [lib/validators.js](lib/validators.js)
- [app/api/auth/register/route.js](app/api/auth/register/route.js)

## 4) Profile Update Logic
### Implemented
- Profile read/update APIs were hardened to prevent invalid payloads from reaching MongoDB.
- Field sanitization and enum checks were added so profile data is consistent.
- Profile editing flow now supports updates for fields like bio, phone, specialization, and personal details.
- Frontend profile editing was moved to a dedicated page to avoid modal conflicts and stale state problems.

### Guardrails
- Invalid role or enum values are rejected.
- Missing or malformed profile data does not crash the API.
- Profile updates are validated before writing to the database.

### Files involved
- [app/api/profile/route.js](app/api/profile/route.js)
- [app/profile/edit/page.js](app/profile/edit/page.js)
- [lib/validators.js](lib/validators.js)

## 5) Application Review Workflow
### Implemented
- Applicants can submit applications via the API.
- Staff users can view all pending applications.
- Officers/teachers/admin can accept or reject applications.
- Accepting/rejecting an applicant can trigger role assignment or state changes in the user record.

### Result
- The application pipeline is now operational as a staff-driven review process rather than a placeholder UI.

### Files involved
- [app/api/applications/route.js](app/api/applications/route.js)
- [app/api/applications/[id]/route.js](app/api/applications/[id]/route.js)
- [app/applications/page.js](app/applications/page.js)

## 6) Events and User Data Handling
### Implemented
- Event creation and modification are restricted to staff roles.
- RSVP handling is available through API routes.
- User records support role metadata and officer-specific positions.

### Files involved
- [models/Event.js](models/Event.js)
- [app/api/events/route.js](app/api/events/route.js)
- [app/api/events/[id]/route.js](app/api/events/[id]/route.js)
- [app/api/events/[id]/rsvp/route.js](app/api/events/[id]/rsvp/route.js)

## 7) Validation Hardening Pattern
### Centralized pattern used
- All major request payloads now go through Zod validation before interacting with MongoDB.
- This prevents malformed data from causing runtime/server errors and protects the schema contract.

### Why this matters
- It reduces 500 errors from invalid enum values and unexpected fields.
- It makes the app more predictable with a single validation source.
- It keeps frontend forms and backend schema aligned.

## 8) Known Outstanding Items
- Add separate validation for `student`, `teacher`, and `adviser` account creation.
- Add stricter ID pattern enforcement for each account type.
- Add a real password reset system with recovery email flow.
- Consider adding Google OAuth as an optional sign-in method.
- Add rate limiting and stronger abuse prevention on auth and profile APIs.

## 9) Core Conclusion
The backend was stabilized around four main principles:
1. enforce identity validation early,
2. restrict access by role,
3. treat server auth as the source of truth,
4. validate all profile and request payloads before writing to MongoDB.

This significantly improved the reliability of the portal and created a cleaner foundation for the next security and identity features.
