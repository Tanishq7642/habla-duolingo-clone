"""Application settings and the game-balance constants.

Every tunable number lives here so reward rules are reviewable in one place
instead of being scattered as magic numbers through services.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class GameRules(BaseModel):
    max_hearts: int = 5
    completion_bonus_xp: int = 5
    perfect_bonus_xp: int = 5
    practice_completion_xp: int = 5
    lesson_gems: int = 5
    perfect_lesson_gems: int = 5
    heart_refill_cost_gems: int = 350
    practice_heart_reward: int = 1
    practice_session_size: int = 6
    allowed_daily_goals: tuple[int, ...] = (10, 20, 30, 50)
    mastery_cap: int = 5
    leaderboard_size: int = 20


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="HABLA_", env_file=".env", extra="ignore")

    database_url: str = f"sqlite:///{(BACKEND_DIR / 'habla.db').as_posix()}"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    # Simplified identity: requests without X-User-Id act as the seeded demo learner.
    demo_username: str = "demo"
    sql_echo: bool = False

    rules: GameRules = GameRules()


@lru_cache
def get_settings() -> Settings:
    return Settings()
