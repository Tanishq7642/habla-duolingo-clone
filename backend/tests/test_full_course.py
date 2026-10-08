"""Play the entire seeded course through the HTTP API, start to finish.

At every step the path must say exactly what's unlocked: never more (no
skipping ahead), never less (completing a skill always unlocks the next).
"""

from tests.conftest import demo
from tests.test_lesson_flow import play_through, start


def path_snapshot(client):
    units = client.get("/api/path").json()["units"]
    return [s for u in units for s in u["skills"]]


def test_whole_course_can_be_completed_in_order(client, db):
    skills = path_snapshot(client)
    xp_before = client.get("/api/me").json()["total_xp"]
    xp_awarded = 0
    lessons_played = 0

    for index, skill in enumerate(skills):
        for lesson in skill["lessons"]:
            current = {s["id"]: s for s in path_snapshot(client)}[skill["id"]]
            status = next(l for l in current["lessons"] if l["id"] == lesson["id"])["status"]
            assert status in ("available", "completed"), f"{skill['title']} lesson {lesson['position']} is {status}"

            # Nothing beyond the current skill may be startable.
            for later in skills[index + 1:]:
                if current["status"] != "completed":
                    r = client.post(f"/api/lessons/{later['lessons'][0]['id']}/start")
                    assert r.status_code == 403, f"{later['title']} should be locked"
                break

            session = start(client, lesson["id"])
            for exercise in session["exercises"]:
                assert "solution" not in exercise and "accepted" not in exercise["data"]
            session = play_through(client, db, session)
            done = client.post(f"/api/attempts/{session['attempt_id']}/complete").json()
            assert done["already_completed"] is False
            xp_awarded += done["xp"]["total"]
            lessons_played += 1

        after = {s["id"]: s for s in path_snapshot(client)}
        assert after[skill["id"]]["status"] == "completed"
        if index + 1 < len(skills):
            # Next skill opens ("in_progress" if the learner had already started it).
            assert after[skills[index + 1]["id"]]["status"] in ("available", "in_progress")

    final = path_snapshot(client)
    assert all(s["status"] == "completed" and s["mastery"] >= 1 for s in final)

    me = client.get("/api/me").json()
    assert me["total_xp"] == xp_before + xp_awarded
    stats = client.get("/api/me/stats").json()
    assert stats["skills_completed"] == stats["skills_total"] == len(skills)
    unlocked = {a["code"] for a in stats["achievements"] if a["unlocked_at"]}
    assert {"lessons_10", "xp_500", "first_skill"} <= unlocked
    assert lessons_played == sum(len(s["lessons"]) for s in skills)
    assert demo(db).total_xp == me["total_xp"]  # API and database agree
