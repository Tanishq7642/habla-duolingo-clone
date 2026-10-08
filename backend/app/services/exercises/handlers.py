"""Concrete exercise types. Importing this module registers them."""

from pydantic import BaseModel, Field, field_validator

from app.core.errors import InvalidAnswer
from app.services.exercises.normalize import normalize, strip_accents
from app.services.exercises.registry import CheckResult, ExerciseHandler, register


class Choice(BaseModel):
    id: str
    text: str
    emoji: str | None = None


class Tile(BaseModel):
    id: str
    text: str


class ChoiceSolution(BaseModel):
    option_id: str


class ChoiceAnswer(BaseModel):
    option_id: str = Field(min_length=1, max_length=32)


class _ChoiceHandler(ExerciseHandler):
    """Shared logic for "pick one option" exercises."""

    SolutionModel = ChoiceSolution
    AnswerModel = ChoiceAnswer

    def validate_consistency(self, data, solution):
        if solution.option_id not in {o.id for o in data.options}:
            raise ValueError(f"solution option {solution.option_id!r} is not among the options")

    def option_text(self, data, option_id: str) -> str:
        for o in data.options:
            if o.id == option_id:
                return o.text
        raise InvalidAnswer("Selected option does not belong to this exercise.")

    def describe_answer(self, data, answer):
        return self.option_text(data, answer.option_id)

    def describe_solution(self, data, solution):
        return self.option_text(data, solution.option_id)

    def check(self, data, solution, answer):
        self.option_text(data, answer.option_id)  # rejects foreign option ids
        return CheckResult(
            correct=answer.option_id == solution.option_id,
            correct_answer=self.describe_solution(data, solution),
        )


# ---------------------------------------------------------------- multiple choice
class MultipleChoiceData(BaseModel):
    options: list[Choice] = Field(min_length=2)


@register
class MultipleChoiceHandler(_ChoiceHandler):
    type = "multiple_choice"
    DataModel = MultipleChoiceData


# ---------------------------------------------------------------- fill in the blank
class FillBlankData(BaseModel):
    before: str = ""
    after: str = ""
    translation: str | None = None
    options: list[Choice] = Field(min_length=2)


@register
class FillBlankHandler(_ChoiceHandler):
    type = "fill_blank"
    DataModel = FillBlankData

    def _sentence(self, data, word: str) -> str:
        return " ".join(f"{data.before} {word} {data.after}".split())

    def describe_answer(self, data, answer):
        return self._sentence(data, super().describe_answer(data, answer))

    def describe_solution(self, data, solution):
        return self._sentence(data, super().describe_solution(data, solution))


# ---------------------------------------------------------------- word bank
class WordBankData(BaseModel):
    source_text: str
    tiles: list[Tile] = Field(min_length=2)


class WordBankSolution(BaseModel):
    # Several word orders can be right ("Yo bebo agua" / "Bebo agua").
    accepted: list[list[str]] = Field(min_length=1)


class WordBankAnswer(BaseModel):
    tile_ids: list[str] = Field(min_length=1, max_length=30)


@register
class WordBankHandler(ExerciseHandler):
    type = "word_bank"
    DataModel = WordBankData
    SolutionModel = WordBankSolution
    AnswerModel = WordBankAnswer

    def validate_consistency(self, data, solution):
        available = [normalize(t.text) for t in data.tiles]
        for sentence in solution.accepted:
            pool = list(available)
            for word in sentence:
                if normalize(word) not in pool:
                    raise ValueError(f"accepted word {word!r} has no tile")
                pool.remove(normalize(word))

    def _words(self, data, answer) -> list[str]:
        by_id = {t.id: t.text for t in data.tiles}
        if len(set(answer.tile_ids)) != len(answer.tile_ids):
            raise InvalidAnswer("A word tile can only be used once.")
        if any(tid not in by_id for tid in answer.tile_ids):
            raise InvalidAnswer("Answer contains tiles that are not part of this exercise.")
        return [by_id[tid] for tid in answer.tile_ids]

    def describe_answer(self, data, answer):
        return " ".join(self._words(data, answer))

    def describe_solution(self, data, solution):
        return " ".join(solution.accepted[0])

    def check(self, data, solution, answer):
        built = normalize(" ".join(self._words(data, answer)))
        correct = any(built == normalize(" ".join(s)) for s in solution.accepted)
        return CheckResult(correct=correct, correct_answer=self.describe_solution(data, solution))


# ---------------------------------------------------------------- match pairs
class MatchPairsData(BaseModel):
    left: list[Tile] = Field(min_length=2)
    right: list[Tile] = Field(min_length=2)


class MatchPairsSolution(BaseModel):
    pairs: dict[str, str]  # left_id -> right_id


class MatchPairsAnswer(BaseModel):
    pairs: dict[str, str] = Field(min_length=1, max_length=12)


@register
class MatchPairsHandler(ExerciseHandler):
    """Learners pair every tile, then submit the whole board. Checking per tap
    on the client would require shipping the answer key; checking per tap on
    the server would let a client probe it. One authoritative check, with the
    wrong pairs reported back for feedback, avoids both."""

    type = "match_pairs"
    DataModel = MatchPairsData
    SolutionModel = MatchPairsSolution
    AnswerModel = MatchPairsAnswer

    def validate_consistency(self, data, solution):
        left = {t.id for t in data.left}
        right = {t.id for t in data.right}
        if set(solution.pairs) != left or set(solution.pairs.values()) != right:
            raise ValueError("pairs must map every left tile to a distinct right tile")

    def _describe(self, data, pairs: dict[str, str]) -> str:
        left = {t.id: t.text for t in data.left}
        right = {t.id: t.text for t in data.right}
        return ", ".join(f"{left.get(l, '?')} = {right.get(r, '?')}" for l, r in pairs.items())

    def describe_answer(self, data, answer):
        return self._describe(data, answer.pairs)

    def describe_solution(self, data, solution):
        return self._describe(data, solution.pairs)

    def check(self, data, solution, answer):
        left_ids = {t.id for t in data.left}
        right_ids = {t.id for t in data.right}
        if set(answer.pairs) != left_ids:
            raise InvalidAnswer("Match every word before checking.")
        values = list(answer.pairs.values())
        if set(values) != right_ids or len(set(values)) != len(values):
            raise InvalidAnswer("Each word on the right can only be matched once.")
        wrong = sorted(lid for lid, rid in answer.pairs.items() if solution.pairs[lid] != rid)
        return CheckResult(
            correct=not wrong,
            correct_answer=self.describe_solution(data, solution),
            detail={"wrong_left_ids": wrong},
        )


# ---------------------------------------------------------------- type answer
class TypeAnswerData(BaseModel):
    source_text: str | None = None
    placeholder: str = "Type your answer"
    answer_language: str = "es"


class TypeAnswerSolution(BaseModel):
    accepted: list[str] = Field(min_length=1)


class TypeAnswerAnswer(BaseModel):
    text: str = Field(max_length=200)

    @field_validator("text")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("answer is empty")
        return v


@register
class TypeAnswerHandler(ExerciseHandler):
    type = "type_answer"
    DataModel = TypeAnswerData
    SolutionModel = TypeAnswerSolution
    AnswerModel = TypeAnswerAnswer

    def describe_answer(self, data, answer):
        return answer.text.strip()

    def describe_solution(self, data, solution):
        return solution.accepted[0]

    def check(self, data, solution, answer):
        given = normalize(answer.text)
        primary = solution.accepted[0]
        if any(given == normalize(a) for a in solution.accepted):
            return CheckResult(correct=True, correct_answer=primary)
        # Accent-only slips are accepted but called out; spelling errors are not.
        for accepted in solution.accepted:
            if strip_accents(given) == strip_accents(normalize(accepted)):
                return CheckResult(correct=True, correct_answer=accepted,
                                   note=f"Watch your accents: “{accepted}”")
        return CheckResult(correct=False, correct_answer=primary)
