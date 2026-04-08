from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .models import HighScoreCreate, HighScoreListResponse, SaveScoreResponse
from .store import build_store

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.score_store = build_store(settings.mongodb_uri, settings.database_name)
    yield


app = FastAPI(
    title="RPG T Shooter API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.cors_origin == "*" else [settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, bool]:
    return {"ok": True}


@app.get("/api/highscores", response_model=HighScoreListResponse)
def get_highscores() -> HighScoreListResponse:
    scores = app.state.score_store.list_top_scores(limit=10)
    return HighScoreListResponse(scores=scores)


@app.post("/api/highscores", response_model=SaveScoreResponse, status_code=201)
def save_highscore(payload: HighScoreCreate) -> SaveScoreResponse:
    entry = app.state.score_store.submit_score(payload)
    return SaveScoreResponse(ok=True, entry=entry)
