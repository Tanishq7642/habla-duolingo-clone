import os
from datetime import datetime, timezone

# Tests use their own in-memory DB; never auto-seed the developer's habla.db.
os.environ["HABLA_AUTO_SEED"] = "false"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import deps
from app.db.session import get_db
from app.main import app
from app.models import Lesson, User
from app.seed import seed as seed_module

FIXED_NOW = datetime(2026, 3, 10, 12, 0, tzinfo=timezone.utc)


class FakeClock:
    def __init__(self, now: datetime):
        self.now = now

    def __call__(self) -> datetime:
        return self.now


@pytest.fixture
def engine():
    eng = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    @event.listens_for(eng, "connect")
    def _fk(conn, _):
        conn.execute("PRAGMA foreign_keys=ON")

    seed_module.run(eng, now=FIXED_NOW)
    return eng


@pytest.fixture
def db(engine):
    with Session(engine, expire_on_commit=False) as session:
        yield session


@pytest.fixture
def clock():
    return FakeClock(FIXED_NOW)


@pytest.fixture
def client(engine, clock):
    SessionTest = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    def _db():
        s = SessionTest()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[deps.get_now] = clock
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def lessons(db) -> dict[str, int]:
    """Lesson ids by "Skill/position" e.g. "Food/2"."""
    return {f"{l.skill.title}/{l.position}": l.id for l in db.query(Lesson).all()}


def demo(db) -> User:
    return db.query(User).filter_by(username="demo").one()
