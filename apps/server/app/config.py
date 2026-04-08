from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(slots=True)
class Settings:
    port: int = 3001
    mongodb_uri: str = ""
    database_name: str = "neon-space-shooter"
    cors_origin: str = "*"


def get_settings() -> Settings:
    return Settings(
        port=int(os.getenv("PORT", "3001")),
        mongodb_uri=os.getenv("MONGODB_URI", ""),
        database_name=os.getenv("MONGODB_DB", "neon-space-shooter"),
        cors_origin=os.getenv("CORS_ORIGIN", "*"),
    )
