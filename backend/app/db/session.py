from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core import timing
from app.core.config import get_settings


def make_engine(url: str, echo: bool = False) -> Engine:
    is_sqlite = url.startswith("sqlite")
    engine = create_engine(
        url,
        echo=echo,
        connect_args=(
            {"check_same_thread": False}
            if is_sqlite
            # Postgres: no server-side prepared statements. Transaction-mode
            # poolers (PgBouncer, e.g. Neon's pooled URL) can hand each
            # transaction a different backend, where they don't exist / clash.
            else {"prepare_threshold": None}
        ),
        # Hosted Postgres (e.g. Neon) drops idle connections; check before use.
        pool_pre_ping=not is_sqlite,
    )
    timing.instrument(engine)
    if is_sqlite:

        @event.listens_for(engine, "connect")
        def _sqlite_pragmas(dbapi_conn, _record):  # pragma: no cover - driver hook
            cur = dbapi_conn.cursor()
            # SQLite ignores FKs unless asked; WAL lets reads proceed during writes.
            cur.execute("PRAGMA foreign_keys=ON")
            if ":memory:" not in url:
                cur.execute("PRAGMA journal_mode=WAL")
            cur.execute("PRAGMA busy_timeout=5000")
            cur.close()

    return engine


_settings = get_settings()
engine = make_engine(_settings.database_url, _settings.sql_echo)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """One session per request. Services commit at the end of a use case;
    anything that escapes rolls back so a request never half-applies."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
