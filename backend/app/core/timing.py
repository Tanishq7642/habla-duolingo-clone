"""Per-request timing exposed as a standard `Server-Timing` response header.

    Server-Timing: app;dur=412.3, db;dur=388.1;desc="9 queries"

Browser dev tools show it in the Network tab, so slow requests can be split
into "our code" vs "database round-trips" without any extra tooling.
"""

import time
from contextvars import ContextVar
from dataclasses import dataclass

from sqlalchemy import event
from sqlalchemy.engine import Engine


@dataclass
class RequestStats:
    queries: int = 0
    db_seconds: float = 0.0


_stats: ContextVar[RequestStats | None] = ContextVar("request_stats", default=None)


def start_request() -> RequestStats:
    stats = RequestStats()
    _stats.set(stats)
    return stats


def instrument(engine: Engine) -> None:
    @event.listens_for(engine, "before_cursor_execute")
    def _before(conn, cursor, statement, parameters, context, executemany):  # pragma: no cover - hook
        conn.info.setdefault("query_start", []).append(time.perf_counter())

    @event.listens_for(engine, "after_cursor_execute")
    def _after(conn, cursor, statement, parameters, context, executemany):  # pragma: no cover - hook
        started = conn.info["query_start"].pop()
        stats = _stats.get()
        if stats is not None:
            stats.queries += 1
            stats.db_seconds += time.perf_counter() - started


def header(stats: RequestStats, total_seconds: float) -> str:
    return (
        f"app;dur={total_seconds * 1000:.1f}, "
        f'db;dur={stats.db_seconds * 1000:.1f};desc="{stats.queries} queries"'
    )
