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
