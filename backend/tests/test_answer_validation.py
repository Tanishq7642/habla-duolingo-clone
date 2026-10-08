"""Answer checking per exercise type, independent of HTTP and the DB."""

import pytest

from app.core.errors import InvalidAnswer
from app.seed.builders import bank, fill, match, mc, typed
from app.services.exercises import get_handler
from app.services.exercises.normalize import normalize, strip_accents


def evaluate(ex: dict, answer: dict):
    result, _ = get_handler(ex["type"]).evaluate(ex["data"], ex["solution"], answer)
    return result


def option_id(ex: dict, text: str) -> str:
    return next(o["id"] for o in ex["data"]["options"] if o["text"] == text)


def tile_ids(ex: dict, words: list[str]) -> list[str]:
    used: list[str] = []
    for w in words:
        used.append(next(t["id"] for t in ex["data"]["tiles"] if t["text"] == w and t["id"] not in used))
    return used


class TestNormalize:
    def test_case_whitespace_and_punctuation(self):
        assert normalize("  ¡Hola,   Buenos DÍAS!  ") == "hola buenos días"

    def test_accents_preserved_by_normalize_but_strippable(self):
        assert normalize("está") != normalize("esta")
        assert strip_accents("está") == "esta"

    def test_enye_is_a_letter_not_an_accent(self):
        assert strip_accents("año") == "año"


class TestMultipleChoice:
    ex = mc("Which one is 'apple'?", ["manzana", "casa", "perro", "agua"], "manzana", "…")

    def test_correct(self):
        assert evaluate(self.ex, {"option_id": option_id(self.ex, "manzana")}).correct

    def test_incorrect_reveals_solution_text(self):
        r = evaluate(self.ex, {"option_id": option_id(self.ex, "casa")})
        assert not r.correct and r.correct_answer == "manzana"

    def test_foreign_option_rejected(self):
        with pytest.raises(InvalidAnswer):
            evaluate(self.ex, {"option_id": "zz"})

    def test_malformed_payload_rejected(self):
        with pytest.raises(InvalidAnswer):
            evaluate(self.ex, {"tile_ids": ["a"]})


class TestFillBlank:
    ex = fill("Yo ___ agua.", ["bebo", "como", "tengo"], "bebo", "I drink water.", "…")

    def test_solution_shown_as_full_sentence(self):
        r = evaluate(self.ex, {"option_id": option_id(self.ex, "como")})
        assert not r.correct and r.correct_answer == "Yo bebo agua."


class TestWordBank:
    ex = bank("I drink water.", "Yo bebo agua", ["como", "leche"], "…", also=["Bebo agua"])

    def test_primary_order(self):
        assert evaluate(self.ex, {"tile_ids": tile_ids(self.ex, ["Yo", "bebo", "agua"])}).correct

    def test_alternative_accepted(self):
        assert evaluate(self.ex, {"tile_ids": tile_ids(self.ex, ["bebo", "agua"])}).correct

    def test_wrong_order_rejected(self):
        assert not evaluate(self.ex, {"tile_ids": tile_ids(self.ex, ["agua", "bebo", "Yo"])}).correct

    def test_duplicate_tile_rejected(self):
        tid = tile_ids(self.ex, ["agua"])[0]
        with pytest.raises(InvalidAnswer):
            evaluate(self.ex, {"tile_ids": [tid, tid]})


class TestMatchPairs:
    ex = match([("perro", "dog"), ("gato", "cat"), ("agua", "water")])

    def test_all_correct(self):
        assert evaluate(self.ex, {"pairs": self.ex["solution"]["pairs"]}).correct

    def test_wrong_pairs_reported(self):
        sol = self.ex["solution"]["pairs"]
        lefts = list(sol)
        swapped = dict(sol)
        swapped[lefts[0]], swapped[lefts[1]] = sol[lefts[1]], sol[lefts[0]]
        r = evaluate(self.ex, {"pairs": swapped})
        assert not r.correct
        assert r.detail["wrong_left_ids"] == sorted(lefts[:2])

    def test_incomplete_board_rejected(self):
        first = dict(list(self.ex["solution"]["pairs"].items())[:1])
        with pytest.raises(InvalidAnswer):
            evaluate(self.ex, {"pairs": first})

    def test_right_tile_reused_rejected(self):
        lefts = list(self.ex["solution"]["pairs"])
        r0 = self.ex["solution"]["pairs"][lefts[0]]
        with pytest.raises(InvalidAnswer):
            evaluate(self.ex, {"pairs": {lid: r0 for lid in lefts}})


class TestTypeAnswer:
    ex = typed("Write this in Spanish", ["buenas tardes"], "…", source="good afternoon")

    @pytest.mark.parametrize("text", ["buenas tardes", "  Buenas   Tardes. ", "¡buenas tardes!"])
    def test_formatting_forgiven(self, text):
        assert evaluate(self.ex, {"text": text}).correct

    def test_spelling_not_forgiven(self):
        assert not evaluate(self.ex, {"text": "buenas tarde"}).correct

    def test_missing_accent_accepted_with_note(self):
        ex = typed("Write", ["el pájaro"], "…")
        r = evaluate(ex, {"text": "el pajaro"})
        assert r.correct and r.note and "pájaro" in r.note

    def test_blank_rejected(self):
        with pytest.raises(InvalidAnswer):
            evaluate(self.ex, {"text": "   "})


def test_seed_content_is_valid():
    """Every authored exercise passes its handler's consistency check."""
    from app.seed.course_spanish import COURSE

    count = 0
    for unit in COURSE["units"]:
        for skill in unit["skills"]:
            for _, exercises in skill["lessons"]:
                for e in exercises:
                    get_handler(e["type"]).validate_content(e["data"], e["solution"])
                    count += 1
    assert count > 60
