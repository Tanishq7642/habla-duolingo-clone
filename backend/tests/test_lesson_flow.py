"""End-to-end lesson engine behaviour through the HTTP API.

Seeded state: Greetings completed, Food lesson 1 completed, Food lesson 2
available, Animals locked. Demo learner has 4 hearts, 4-day streak (last
active yesterday), 0 XP today.
"""

from datetime import timedelta

from app.models import Exercise
from app.seed.seed import _correct_answer, _wrong_answer
from tests.conftest import demo


def ex(db, exercise_id: int) -> Exercise:
    return db.get(Exercise, exercise_id)


def answer(client, db, session: dict, *, correct: bool = True):
    eid = session["next_exercise_id"]
    payload = _correct_answer(ex(db, eid)) if correct else _wrong_answer(ex(db, eid))
    return client.post(f"/api/attempts/{session['attempt_id']}/answers",
                       json={"exercise_id": eid, "answer": payload})


def play_through(client, db, session: dict) -> dict:
    while session["next_exercise_id"] is not None:
        r = answer(client, db, session)
        assert r.status_code == 200, r.text
        session = {**session, "next_exercise_id": r.json()["next_exercise_id"]}
    return session


def start(client, lesson_id: int) -> dict:
    r = client.post(f"/api/lessons/{lesson_id}/start")
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------- start / resume
def test_locked_lesson_cannot_start(client, lessons):
    r = client.post(f"/api/lessons/{lessons['Animals/1']}/start")
    assert r.status_code == 403
    assert r.json()["error"]["code"] == "lesson_locked"


def test_unknown_lesson_is_404(client):
    assert client.post("/api/lessons/99999/start").json()["error"]["code"] == "lesson_not_found"


def test_session_never_exposes_solutions(client, lessons):
    session = start(client, lessons["Food/2"])
    assert session["exercises"]
    for e in session["exercises"]:
        assert "solution" not in e
        assert "solution" not in e["data"] and "accepted" not in e["data"]


def test_starting_twice_resumes_same_session(client, db, lessons):
    first = start(client, lessons["Food/2"])
    answer(client, db, first)
    again = start(client, lessons["Food/2"])
    assert again["attempt_id"] == first["attempt_id"]
    assert again["resumed"] is True
    assert again["progress"]["completed"] == 1


# ---------------------------------------------------------------- answering
def test_correct_answer_awards_provisional_xp_and_keeps_hearts(client, db, lessons):
    session = start(client, lessons["Food/2"])
    body = answer(client, db, session).json()
    assert body["correct"] is True
    assert body["xp_earned"] > 0
    assert body["hearts_remaining"] == 4
    # XP is only credited at completion – never on an unfinished lesson.
    assert client.get("/api/me").json()["total_xp"] == demo(db).total_xp


def test_wrong_answer_costs_a_heart_and_requeues(client, db, lessons):
    session = start(client, lessons["Food/2"])
    first_id = session["next_exercise_id"]
    body = answer(client, db, session, correct=False).json()
    assert body["correct"] is False
    assert body["hearts_remaining"] == 3
    assert body["requeued"] is True
    assert body["correct_answer"]
    # Unseen exercises come first, the missed one is retried at the end.
    assert body["next_exercise_id"] != first_id
    assert client.get("/api/me").json()["hearts"] == 3  # persisted


def test_out_of_order_and_repeat_answers_rejected(client, db, lessons):
    session = start(client, lessons["Food/2"])
    ids = [e["id"] for e in session["exercises"]]
    r = client.post(f"/api/attempts/{session['attempt_id']}/answers",
                    json={"exercise_id": ids[2], "answer": {"option_id": "a"}})
    assert r.status_code == 409 and r.json()["error"]["code"] == "out_of_order"

    answer(client, db, session)  # solve ids[0]
    replay = client.post(f"/api/attempts/{session['attempt_id']}/answers",
                         json={"exercise_id": ids[0], "answer": _correct_answer(ex(db, ids[0]))})
    assert replay.status_code == 409


def test_malformed_answer_is_422_and_costs_nothing(client, lessons):
    session = start(client, lessons["Food/2"])
    r = client.post(f"/api/attempts/{session['attempt_id']}/answers",
                    json={"exercise_id": session["next_exercise_id"], "answer": {"nonsense": True}})
    assert r.status_code == 422
    assert client.get("/api/me").json()["hearts"] == 4
    bad_body = client.post(f"/api/attempts/{session['attempt_id']}/answers", json={"answer": {}})
    assert bad_body.status_code == 422 and bad_body.json()["error"]["code"] == "validation_error"


def test_other_learners_session_is_invisible(client, lessons):
    session = start(client, lessons["Food/2"])
    r = client.get(f"/api/attempts/{session['attempt_id']}", headers={"X-User-Id": "1"})
    assert r.status_code == 404


# ---------------------------------------------------------------- hearts
def test_out_of_hearts_blocks_play_until_practice_or_refill(client, db, lessons):
    session = start(client, lessons["Food/2"])
    body = None
    for _ in range(4):
        body = answer(client, db, session, correct=False).json()
        session = {**session, "next_exercise_id": body["next_exercise_id"]}
    assert body["hearts_remaining"] == 0 and body["out_of_hearts"] is True

    blocked = answer(client, db, session)
    assert blocked.status_code == 403 and blocked.json()["error"]["code"] == "out_of_hearts"

    # Practice doesn't need hearts and earns one back.
    practice = client.post("/api/practice/start").json()
    play_through(client, db, practice)
    done = client.post(f"/api/attempts/{practice['attempt_id']}/complete").json()
    assert done["hearts_awarded"] == 1 and done["hearts"] == 1
    assert answer(client, db, session).status_code == 200


def test_refill_requires_gems(client, db):
    user = demo(db)
    user.gems = 10
    db.commit()
    r = client.post("/api/me/hearts/refill")
    assert r.status_code == 402 and r.json()["error"]["code"] == "insufficient_gems"
    user.gems = 1000
    db.commit()
    ok = client.post("/api/me/hearts/refill").json()
    assert ok["hearts"] == 5 and ok["gems"] == 650
    assert client.post("/api/me/hearts/refill").status_code == 409  # already full


# ---------------------------------------------------------------- completion
def test_cannot_complete_unfinished_session(client, db, lessons):
    session = start(client, lessons["Food/2"])
    answer(client, db, session)
    r = client.post(f"/api/attempts/{session['attempt_id']}/complete")
    assert r.status_code == 409 and r.json()["error"]["code"] == "session_incomplete"


def test_completion_updates_everything_and_unlocks_next_skill(client, db, lessons):
    before = client.get("/api/me").json()
    session = play_through(client, db, start(client, lessons["Food/2"]))
    done = client.post(f"/api/attempts/{session['attempt_id']}/complete").json()

    assert done["already_completed"] is False
    assert done["perfect"] is True and done["xp"]["total"] > done["xp"]["base"]
    assert done["streak"] == {"current": 5, "longest": 5, "extended": True}
    assert done["daily_goal"]["xp_today"] == done["xp"]["total"]
    assert done["daily_goal"]["just_reached"] is True
    assert done["skill"]["just_completed"] is True
    assert done["unlocked_skill"]["title"] == "Animals"

    after = client.get("/api/me").json()
    assert after["total_xp"] == before["total_xp"] + done["xp"]["total"]
    assert after["gems"] == before["gems"] + done["gems_awarded"]
    assert after["streak"]["extended_today"] is True

    skills = {s["title"]: s for u in client.get("/api/path").json()["units"] for s in u["skills"]}
    assert skills["Food"]["status"] == "completed"
    assert skills["Animals"]["status"] == "available"
    assert skills["Family"]["status"] == "locked"
    assert client.post(f"/api/lessons/{lessons['Animals/1']}/start").status_code == 200


def test_duplicate_completion_is_idempotent(client, db, lessons):
    session = play_through(client, db, start(client, lessons["Food/2"]))
    url = f"/api/attempts/{session['attempt_id']}/complete"
    first = client.post(url).json()
    xp_after_first = client.get("/api/me").json()["total_xp"]

    second = client.post(url)
    assert second.status_code == 200
    assert second.json()["already_completed"] is True
    assert second.json()["xp"] == first["xp"]  # same receipt
    assert client.get("/api/me").json()["total_xp"] == xp_after_first  # no double award
    stats = client.get("/api/me/stats").json()
    assert stats["lessons_completed"] == 6  # 5 seeded + this one, counted once


def test_completed_session_rejects_further_answers(client, db, lessons):
    session = start(client, lessons["Food/2"])
    ids = [e["id"] for e in session["exercises"]]
    session = play_through(client, db, session)
    client.post(f"/api/attempts/{session['attempt_id']}/complete")
    r = client.post(f"/api/attempts/{session['attempt_id']}/answers",
                    json={"exercise_id": ids[0], "answer": {"option_id": "a"}})
    assert r.status_code == 409 and r.json()["error"]["code"] == "attempt_closed"


def test_mistake_review_after_completion(client, db, lessons):
    session = start(client, lessons["Food/2"])
    assert client.get(f"/api/attempts/{session['attempt_id']}/review").status_code == 409  # no peeking
    r = answer(client, db, session, correct=False).json()
    session = play_through(client, db, {**session, "next_exercise_id": r["next_exercise_id"]})
    done = client.post(f"/api/attempts/{session['attempt_id']}/complete").json()
    assert done["perfect"] is False and done["mistakes"] == 1
    items = client.get(f"/api/attempts/{session['attempt_id']}/review").json()["items"]
    assert len(items) == 1 and items[0]["correct_answer"] and items[0]["your_answer"]


def test_streak_resets_after_missed_day(client, db, lessons, clock):
    clock.now += timedelta(days=2)  # skipped "today" entirely
    assert client.get("/api/me").json()["streak"]["current"] == 0
    session = play_through(client, db, start(client, lessons["Food/2"]))
    done = client.post(f"/api/attempts/{session['attempt_id']}/complete").json()
    assert done["streak"]["current"] == 1 and done["streak"]["longest"] == 4


def test_achievements_unlock_once(client, db, lessons):
    session = play_through(client, db, start(client, lessons["Food/2"]))
    done = client.post(f"/api/attempts/{session['attempt_id']}/complete").json()
    codes = {a["code"] for a in done["achievements"]}
    # Already earned during seeding → not re-awarded.
    assert "first_lesson" not in codes
    stats = client.get("/api/me/stats").json()
    assert sum(1 for a in stats["achievements"] if a["code"] == "first_lesson" and a["unlocked_at"]) == 1


def test_daily_goal_setting_validation(client):
    assert client.patch("/api/me/settings", json={"daily_goal_xp": 30}).json()["daily_goal"]["goal_xp"] == 30
    r = client.patch("/api/me/settings", json={"daily_goal_xp": 7})
    assert r.status_code == 400 and r.json()["error"]["code"] == "invalid_daily_goal"
    assert client.patch("/api/me/settings", json={"timezone": "Mars/Base"}).status_code == 400


def test_leaderboard_highlights_learner(client):
    for period in ("week", "all"):
        board = client.get(f"/api/leaderboard?period={period}").json()
        mine = [e for e in board["entries"] if e["is_me"]] or [board["me"]]
        assert mine[0]["username"] == "demo"
        xps = [e["xp"] for e in board["entries"]]
        assert xps == sorted(xps, reverse=True)
    assert client.get("/api/leaderboard?period=year").status_code == 422
