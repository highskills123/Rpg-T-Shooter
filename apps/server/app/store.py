from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable

from pymongo import MongoClient
from pymongo.collection import Collection

from .models import HighScoreCreate, HighScoreRecord


def sort_scores(entries: Iterable[dict], limit: int = 10) -> list[dict]:
    return sorted(
        entries,
        key=lambda entry: (
            -int(entry["score"]),
            -datetime.fromisoformat(entry["created_at"]).timestamp(),
        ),
    )[:limit]


class InMemoryHighScoreStore:
    def __init__(self, seed_scores: Iterable[dict] | None = None) -> None:
        self._scores: list[dict] = list(seed_scores or [])

    def list_top_scores(self, limit: int = 10) -> list[HighScoreRecord]:
        return [HighScoreRecord.model_validate(entry) for entry in sort_scores(self._scores, limit)]

    def submit_score(self, payload: HighScoreCreate) -> HighScoreRecord:
        entry = HighScoreRecord(
            **payload.model_dump(),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self._scores.append(entry.model_dump())
        return entry


class MongoHighScoreStore:
    def __init__(self, collection: Collection) -> None:
        self.collection = collection
        self.collection.create_index([("score", -1), ("created_at", -1)])

    def list_top_scores(self, limit: int = 10) -> list[HighScoreRecord]:
        results = self.collection.find({}, {"_id": 0}).sort([("score", -1), ("created_at", -1)]).limit(limit)
        return [HighScoreRecord.model_validate(record) for record in results]

    def submit_score(self, payload: HighScoreCreate) -> HighScoreRecord:
        entry = HighScoreRecord(
            **payload.model_dump(),
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        self.collection.insert_one(entry.model_dump())
        return entry


def build_store(mongodb_uri: str, database_name: str):
    if mongodb_uri:
        client = MongoClient(mongodb_uri)
        collection = client[database_name]["highscores"]
        return MongoHighScoreStore(collection)

    return InMemoryHighScoreStore(
        seed_scores=[
            {
                "name": "ACE",
                "score": 42000,
                "level": 7,
                "kills": 61,
                "weapon_key": "laser",
                "created_at": "2026-04-01T12:00:00+00:00",
            },
            {
                "name": "ION",
                "score": 30150,
                "level": 6,
                "kills": 47,
                "weapon_key": "spread",
                "created_at": "2026-04-02T12:00:00+00:00",
            },
            {
                "name": "N7N",
                "score": 26880,
                "level": 5,
                "kills": 39,
                "weapon_key": "plasma",
                "created_at": "2026-04-03T12:00:00+00:00",
            },
        ]
    )
