# Deployment Readiness

The app is locally integrated and has a provider-neutral deployment procedure. No production deployment has been made because a hosting provider, DNS name, TLS endpoint, and production database credentials have not been supplied.

## Required configuration

Set these values in the hosting platform's secret/configuration manager, not in source control:

```text
APP_ENV=production
APP_NAME=User Management API
DATABASE_URL=mysql+pymysql://<app-user>:<encoded-password>@<mysql-host>:3306/user_management
SECRET_KEY=<unique-random-value-at-least-32-characters>
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=https://<frontend-origin>
```

`SECRET_KEY` must be unique and at least 32 characters. Production startup rejects the development key and placeholder database password. Set `CORS_ORIGINS` to the exact browser origin when the frontend and API are on different origins; leave it empty behind a same-origin reverse proxy.

## Release sequence

1. Provision MySQL and a least-privilege app account; enable automated backups and test recovery.
2. Install backend dependencies and run `alembic upgrade head` once as a release step before starting API replicas.
3. Start the API with `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2` behind a TLS-terminating reverse proxy.
4. Build the frontend with `npm ci` and `npm run build`; set `VITE_API_BASE_URL` to the public API base or `/api/v1` when using a same-origin proxy.
5. Serve the frontend over HTTPS and route `/api/*` to the API. Apply ingress rate limits to registration and login, and restrict database network access to the API.
6. Create the first administrator with `python -m scripts.create_admin` over a secure terminal session.
7. Check `/api/v1/health` for process liveness and `/api/v1/ready` for database readiness. In production, interactive API docs are disabled.

Rotate `SECRET_KEY` to invalidate all outstanding access tokens. Password changes revoke tokens for the changed account. Keep application logs free of authorization headers, passwords, database URLs, and signing keys.