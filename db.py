import sqlite3
import threading

_DB_PATH = "translations.db"
_lock = threading.Lock()

def _get_conn():
    return sqlite3.connect(_DB_PATH, check_same_thread=False)

def init_db():
    with _lock:
        with _get_conn() as conn:
            conn.execute(
                """CREATE TABLE IF NOT EXISTS translations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_text TEXT UNIQUE,
                translated_text TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )"""
            )
            conn.commit()

def get_cached_translation(source_text: str):
    with _lock:
        with _get_conn() as conn:
            cur = conn.execute(
                "SELECT translated_text FROM translations WHERE source_text=?", (source_text,)
            )
            row = cur.fetchone()
            return row[0] if row else None

def save_translation(source_text: str, translated_text: str):
    with _lock:
        with _get_conn() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO translations (source_text, translated_text) VALUES (?, ?)",
                (source_text, translated_text),
            )
            conn.commit()