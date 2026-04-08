import unittest

from app.models import HighScoreCreate, sanitize_name
from app.store import InMemoryHighScoreStore, sort_scores


class StoreTests(unittest.TestCase):
    def test_sanitize_name(self):
        self.assertEqual(sanitize_name("a-b9"), "AB9")

    def test_store_sorts_scores(self):
        ordered = sort_scores(
            [
                {"name": "OLD", "score": 1000, "level": 1, "kills": 1, "weapon_key": "plasma", "created_at": "2026-03-01T00:00:00+00:00"},
                {"name": "TOP", "score": 2200, "level": 3, "kills": 8, "weapon_key": "laser", "created_at": "2026-02-01T00:00:00+00:00"},
                {"name": "NEW", "score": 1000, "level": 2, "kills": 4, "weapon_key": "spread", "created_at": "2026-04-01T00:00:00+00:00"},
            ]
        )
        self.assertEqual([entry["name"] for entry in ordered], ["TOP", "NEW", "OLD"])

    def test_in_memory_store_submission(self):
        store = InMemoryHighScoreStore()
        entry = store.submit_score(
            HighScoreCreate(name="c9z", score=9999, level=3, kills=15, weapon_key="chain")
        )
        self.assertEqual(entry.name, "C9Z")
        self.assertEqual(store.list_top_scores()[0].score, 9999)


if __name__ == "__main__":
    unittest.main()
