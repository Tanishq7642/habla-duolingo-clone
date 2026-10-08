"""Exercise handler registry.

Each exercise type is one handler declaring three Pydantic shapes:
  * DataModel     – public payload the client renders (options, tiles, …)
  * SolutionModel – private answer key, stored in `exercises.solution`
  * AnswerModel   – what the client submits

and one `check` method. The lesson engine, API and DB never branch on type;
adding "listening" means writing one handler and registering it.
"""

from dataclasses import dataclass
from typing import Any, ClassVar

from pydantic import BaseModel, ValidationError

from app.core.errors import InvalidAnswer


@dataclass(frozen=True)
class CheckResult:
    correct: bool
    correct_answer: str  # human-readable solution, revealed only after checking
    note: str | None = None  # e.g. "Watch your accents"
    detail: dict[str, Any] | None = None  # type-specific feedback (e.g. wrong pairs)


class ExerciseHandler:
    type: ClassVar[str]
    DataModel: ClassVar[type[BaseModel]]
    SolutionModel: ClassVar[type[BaseModel]]
    AnswerModel: ClassVar[type[BaseModel]]

    def check(self, data: Any, solution: Any, answer: Any) -> CheckResult:  # pragma: no cover
        raise NotImplementedError

    def describe_answer(self, data: Any, answer: Any) -> str:  # pragma: no cover
        raise NotImplementedError

    def describe_solution(self, data: Any, solution: Any) -> str:  # pragma: no cover
        raise NotImplementedError

    # -- shared plumbing -------------------------------------------------
    def validate_content(self, data: dict, solution: dict) -> None:
        """Called by the seeder so malformed content fails at write time."""
        d = self.DataModel.model_validate(data)
        s = self.SolutionModel.model_validate(solution)
        self.validate_consistency(d, s)

    def validate_consistency(self, data: Any, solution: Any) -> None:
        """Override to assert the solution refers to ids present in data."""

    def evaluate(self, data: dict, solution: dict, raw_answer: Any) -> tuple[CheckResult, dict]:
        try:
            answer = self.AnswerModel.model_validate(raw_answer)
        except ValidationError as exc:
            first = exc.errors()[0]
            raise InvalidAnswer(f"Answer is not valid for a {self.type} exercise: {first['msg']}")
        result = self.check(
            self.DataModel.model_validate(data),
            self.SolutionModel.model_validate(solution),
            answer,
        )
        return result, answer.model_dump()


_REGISTRY: dict[str, ExerciseHandler] = {}


def register(handler_cls: type[ExerciseHandler]) -> type[ExerciseHandler]:
    _REGISTRY[handler_cls.type] = handler_cls()
    return handler_cls


def get_handler(exercise_type: str) -> ExerciseHandler:
    try:
        return _REGISTRY[exercise_type]
    except KeyError:
        raise ValueError(f"No handler registered for exercise type {exercise_type!r}")


def registered_types() -> list[str]:
    return sorted(_REGISTRY)


def solution_text(handler: ExerciseHandler, data: dict, solution: dict) -> str:
    return handler.describe_solution(handler.DataModel.model_validate(data),
                                     handler.SolutionModel.model_validate(solution))


def answer_text(handler: ExerciseHandler, data: dict, answer: dict) -> str:
    try:
        return handler.describe_answer(handler.DataModel.model_validate(data),
                                       handler.AnswerModel.model_validate(answer))
    except (ValidationError, InvalidAnswer):
        return "—"
