# Backend

## Run locally

From this directory, create and activate a virtual environment, install dependencies, and start the API:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m scripts.create_admin
uvicorn app.main:app --reload
```

The health endpoint is available at `http://127.0.0.1:8000/api/v1/health`; interactive API documentation is at `/docs`.
Set `DATABASE_URL` to match your local MySQL user/password. The local `.env` is ignored by git. Replace the development signing key before deployment. The admin setup command prompts for the initial administrator password without echoing it.

See [REQUIREMENTS.md](REQUIREMENTS.md) for the backend scope and outstanding product decisions.

## Tests

```powershell
python -m pytest -q
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for production configuration and release steps.