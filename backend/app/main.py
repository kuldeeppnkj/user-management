from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.routes import router as health_router
from app.api.users import router as users_router
from app.core.config import settings

is_production = settings.app_env == "production"
app = FastAPI(
	title=settings.app_name,
	docs_url=None if is_production else "/docs",
	redoc_url=None,
	openapi_url=None if is_production else "/openapi.json",
)
if settings.cors_origin_list:
	app.add_middleware(
		CORSMiddleware,
		allow_origins=settings.cors_origin_list,
		allow_credentials=False,
		allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
		allow_headers=["Authorization", "Content-Type"],
	)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
	response = await call_next(request)
	response.headers["X-Content-Type-Options"] = "nosniff"
	response.headers["X-Frame-Options"] = "DENY"
	response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
	response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
	return response


app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")