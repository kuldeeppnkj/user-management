# Frontend Requirements

## Goal

Build a React web application for account registration, sign-in, and user administration, backed by the FastAPI service described in [the backend requirements](../backend/REQUIREMENTS.md).

## Foundation

- React with TypeScript, Vite, and client-side routing for authentication, profile, and administrator views.
- Keep the API base URL configurable per environment; use `/api/v1` endpoints.
- Share typed request/response definitions and centralize API error handling.

## Functional requirements

- Provide registration and login forms with client-side validation and useful server-error messages.
- Send the bearer access token in the `Authorization` header, keep it in memory, and require login again after page reload or token expiry; do not expose credentials in URLs or logs.
- Provide a profile view and sign-out action.
- Allow signed-in users to change their password; invalidate their previous access tokens after a successful change.
- Provide an administrator-only user list with pagination, search, and agreed filters.
- Allow authorized administrators to create and edit users, change roles if permitted, and deactivate/reactivate accounts.
- Show loading, empty, success, and error states; confirm destructive or access-changing actions.
- Hide administrative navigation for non-admin users while relying on the API for actual authorization.
- Handle expired sessions and unauthorized responses consistently.

## Quality and accessibility

- Test key routes, form validation, role-aware behavior, and API error states.
- Use semantic HTML, keyboard-accessible controls, visible focus, and labeled form fields.
- Ensure layouts work on mobile and desktop.
- Keep API credentials and secrets out of the frontend bundle; browser-side configuration may contain only public settings.

## Initial implementation defaults

- Public registration creates a regular user; administrators can create users and administrators.
- The UI uses bearer tokens held in memory and requires a new sign-in after reload or expiry.
- Administrator access must be provisioned through the backend before the directory is available.
- Password recovery, refresh tokens, and additional profile editing are not in the current API scope.