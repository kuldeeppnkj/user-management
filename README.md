# Fieldwork User Management

A user-management application with a FastAPI API, MySQL persistence, and a React + TypeScript frontend built with Vite.

## Features

- Public registration, JWT sign-in, and personal profile
- Argon2 password hashing and password changes that revoke previous tokens
- Administrator-managed user directory with search, filters, pagination, role updates, and deactivation
- Alembic schema migrations and database liveness/readiness endpoints

## Local development

Prerequisites: Python 3.12 or newer, Node.js 24, and MySQL 8.4 or compatible.

1. Configure the database and backend environment using [backend/README.md](backend/README.md).
2. Start the frontend using [frontend/README.md](frontend/README.md).
3. Use `backend/DEPLOYMENT.md` for production configuration and release steps.

The local Vite server proxies `/api` requests to FastAPI on `127.0.0.1:8000`. Never commit `.env` files or production secrets. Create an administrator with the backend bootstrap command; no default credentials are included in this repository.

## Project layout

- `backend/`: FastAPI application, SQLAlchemy models, migrations, tests, and deployment guidance
- `frontend/`: React application, API integration, and frontend requirements
- `.github/workflows/ci.yml`: backend tests and frontend lint/build checks