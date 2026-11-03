# Backend Requirements

## Goal

Provide a secure REST API for account authentication and administrator-managed user accounts. The backend is Python/FastAPI, SQLAlchemy, and MySQL. API routes use the `/api/v1` prefix.

## Initial foundation

- FastAPI application with OpenAPI documentation and a health endpoint.
- Environment-based application and database configuration; secrets must not be committed.
- SQLAlchemy user model with unique email, password hash, role, active state, and timestamps.
- Database migrations managed with Alembic; apply the initial migration with `alembic upgrade head`.

## Functional requirements

- Register an account, authenticate, and expose the authenticated user's profile.
- Hash passwords with a modern password-hashing algorithm; never store or return plaintext passwords.
- Issue and validate signed JWT bearer access tokens with a 30-minute lifetime. Password changes increment the user's credential version and revoke previously issued tokens.
- Support `user` and `admin` roles. Users may access their own profile; administrators may manage all accounts.
- Allow administrators to create, list, search, filter, update, deactivate, and reactivate accounts.
- Paginate account-list responses and validate request/response data.
- Return consistent HTTP errors without exposing credentials, hashes, or internal exception details.

## Data model

`users` fields: integer ID, unique indexed lowercase email, optional full name, password hash, role, active flag, credential version, creation timestamp, and update timestamp. Email input is normalized to lowercase before storage.

## Quality and security

- Test authentication, authorization, validation, account lifecycle, and error cases.
- Enforce least privilege and deny administrative operations to non-admin users.
- Keep JWT signing keys and production database credentials in deployment secrets.
- Require a unique production JWT key and non-placeholder database credentials; keep both in deployment secrets.
- Configure exact production CORS origins when frontend and API use different origins; same-origin proxy deployments may leave CORS disabled.
- Terminate TLS at the deployment edge, redact credentials and tokens from logs, rate-limit authentication routes, and use `/api/v1/ready` for readiness checks.

## Initial implementation defaults

- Public self-registration creates a regular `user`; administrators can create accounts with either supported role.
- Passwords must contain at least 12 characters. Passwords are hashed with Argon2.
- The token is returned as a bearer token. The frontend should keep it in memory; login is required again after expiry or page reload.
- Administrators cannot demote or deactivate their own account.
- User search currently matches email; filtering supports role and active status, with pagination capped at 100 records.

Refresh tokens, password recovery, account lockout, and additional profile fields remain outside the current scope and need product decisions before expansion.