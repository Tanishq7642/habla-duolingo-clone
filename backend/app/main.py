import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import dev, leaderboard, me, path, sessions
from app.core import timing
from app.core.config import get_settings
from app.core.errors import DomainError


def _error(status: int, code: str, message: str, details=None) -> JSONResponse:
    body = {"error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return JSONResponse(status_code=status, content=body)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if get_settings().auto_seed:
        from app.db.session import engine
        from app.seed.seed import ensure_seeded

        ensure_seeded(engine)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Habla API", version="1.0.0", description="Gamified language-learning backend",
                  lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def server_timing(request: Request, call_next):
        stats = timing.start_request()
        started = time.perf_counter()
        response = await call_next(request)
        response.headers["Server-Timing"] = timing.header(stats, time.perf_counter() - started)
        return response

    @app.exception_handler(DomainError)
    async def domain_error_handler(_: Request, exc: DomainError):
        return _error(exc.status_code, exc.code, exc.message)

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_: Request, exc: RequestValidationError):
        details = [{"loc": list(e["loc"]), "msg": e["msg"]} for e in exc.errors()]
        return _error(422, "validation_error", "The request body is malformed.", details)

    for module in (me, path, sessions, leaderboard, dev):
        app.include_router(module.router, prefix="/api")

    @app.get("/api/health", tags=["meta"])
    def health():
        return {"status": "ok"}

    return app


app = create_app()
