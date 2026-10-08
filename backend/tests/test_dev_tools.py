"""Demo tools: simulated passage of time drives the real streak rules."""

from tests.test_lesson_flow import play_through, start


def test_missing_a_day_breaks_the_streak(client):
    # Seeded learner was active "yesterday" and hasn't practised today.
    # Skip today entirely: yesterday's activity is now two days old.
    me = client.post("/api/dev/time-travel", json={"days": 1}).json()
    assert me["streak"]["current"] == 0


def test_time_travel_then_lesson_extends_streak(client, db, lessons):
    # Do today's lesson, then jump a day: yesterday's activity now counts as the previous day.
    session = play_through(client, db, start(client, lessons["Food/2"]))
    client.post(f"/api/attempts/{session['attempt_id']}/complete")
    me = client.post("/api/dev/time-travel", json={"days": 1}).json()
    assert me["streak"]["current"] == 5 and me["streak"]["at_risk"] is True
    assert me["daily_goal"]["xp_today"] == 0  # new day, fresh goal

    session = play_through(client, db, start(client, lessons["Animals/1"]))
    done = client.post(f"/api/attempts/{session['attempt_id']}/complete").json()
    assert done["streak"]["current"] == 6 and done["streak"]["extended"] is True


def test_time_travel_validation(client):
    assert client.post("/api/dev/time-travel", json={"days": 0}).status_code == 422


def test_reset_restores_seed(client, db, lessons):
    session = play_through(client, db, start(client, lessons["Food/2"]))
    client.post(f"/api/attempts/{session['attempt_id']}/complete")
    assert client.post("/api/dev/reset").status_code == 204
    me = client.get("/api/me").json()
    assert me["total_xp"] == 178 and me["streak"]["current"] == 4


def test_ensure_seeded_only_seeds_an_empty_database(engine):
    from app.seed.seed import ensure_seeded

    assert ensure_seeded(engine) is False  # already seeded by the fixture: left untouched


def test_ensure_seeded_seeds_a_brand_new_database():
    from sqlalchemy import create_engine
    from sqlalchemy.pool import StaticPool

    from app.seed.seed import ensure_seeded

    fresh = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    assert ensure_seeded(fresh) is True   # no tables yet: seeds
    assert ensure_seeded(fresh) is False  # second boot: one query, no reseed
    fresh.dispose()


def test_daily_reset_requires_the_cron_secret(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "cron_secret", "s3cret")
    assert client.get("/api/dev/cron/daily-reset").status_code == 403
    assert client.get("/api/dev/cron/daily-reset", headers={"Authorization": "Bearer wrong"}).status_code == 403
    client.post("/api/dev/time-travel", json={"days": 1})
    ok = client.get("/api/dev/cron/daily-reset", headers={"Authorization": "Bearer s3cret"})
    assert ok.status_code == 204
    assert client.get("/api/me").json()["streak"]["current"] == 4  # demo story restored


def test_daily_reset_disabled_without_a_configured_secret(client):
    assert client.get("/api/dev/cron/daily-reset", headers={"Authorization": "Bearer "}).status_code == 403


def test_demo_story_holds_in_the_learners_timezone():
    """Regression: at 20:00 UTC it's already tomorrow in India (UTC+5:30). A demo
    seeded on UTC dates showed a *broken* streak there; seeding on the
    learner's calendar keeps "practised yesterday, streak at risk today"."""
    from datetime import datetime, timezone

    from sqlalchemy import create_engine, select
    from sqlalchemy.orm import Session
    from sqlalchemy.pool import StaticPool

    from app.core.config import get_settings
    from app.models import User
    from app.seed.seed import run
    from app.services.learner_service import learner_view

    evening_utc = datetime(2026, 3, 10, 20, 0, tzinfo=timezone.utc)
    eng = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    for tz in ("Asia/Kolkata", "America/Los_Angeles", "UTC"):
        run(eng, now=evening_utc, tz=tz)
        with Session(eng) as db:
            alex = db.scalar(select(User).where(User.username == "demo"))
            streak = learner_view(db, alex, evening_utc, get_settings().rules).streak
        assert (streak.current, streak.at_risk) == (4, True), tz
    eng.dispose()


def test_reset_accepts_the_viewers_timezone(client):
    assert client.post("/api/dev/reset", json={"timezone": "Asia/Kolkata"}).status_code == 204
    assert client.get("/api/me").json()["timezone"] == "Asia/Kolkata"
    assert client.post("/api/dev/reset").status_code == 204  # no body: keeps the current timezone
    assert client.get("/api/me").json()["timezone"] == "Asia/Kolkata"
