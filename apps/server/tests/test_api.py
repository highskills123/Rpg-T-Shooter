import unittest

from app.main import app, get_highscores, save_highscore
from app.models import HighScoreCreate
from app.store import build_store


class ApiTests(unittest.TestCase):
    def setUp(self):
        app.state.score_store = build_store("", "neon-space-shooter")

    def test_get_highscores(self):
        response = get_highscores()
        self.assertGreaterEqual(len(response.scores), 1)
        self.assertEqual(response.scores[0].name, "ACE")

    def test_post_highscore(self):
        payload = HighScoreCreate(
            name="ab7",
            score=12345,
            level=4,
            kills=19,
            weapon_key="rocket",
        )
        response = save_highscore(payload)
        self.assertTrue(response.ok)
        self.assertEqual(response.entry.name, "AB7")


if __name__ == "__main__":
    unittest.main()
