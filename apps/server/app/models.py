from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, Field, field_validator


def sanitize_name(value: str) -> str:
    return "".join(character for character in value.upper() if character.isalnum())[:3]


class HighScoreCreate(BaseModel):
    name: str = Field(min_length=1, max_length=8)
    score: int = Field(ge=0)
    level: int = Field(ge=1)
    kills: int = Field(ge=0)
    weapon_key: str = Field(default="plasma", max_length=20)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        name = sanitize_name(value)
        if len(name) != 3:
            raise ValueError("Name must be exactly 3 alphanumeric characters.")
        return name


class HighScoreRecord(HighScoreCreate):
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class HighScoreListResponse(BaseModel):
    scores: list[HighScoreRecord]


class SaveScoreResponse(BaseModel):
    ok: bool
    entry: HighScoreRecord
