# Frontend

## Run locally

```powershell
npm install
npm run dev
```

Vite runs the app at `http://localhost:5173` and proxies `/api` requests to `http://127.0.0.1:8000`. Start the backend and apply its Alembic migration first. Set `VITE_API_BASE_URL` to the deployed API base URL when building outside local development.

Authentication tokens stay in memory and are cleared on page reload; users sign in again after a reload or token expiry. Public registration creates a regular user. Create the first administrator from the backend directory with `python -m scripts.create_admin` before using the administrator directory.

See [REQUIREMENTS.md](REQUIREMENTS.md) for scope and implemented defaults.
