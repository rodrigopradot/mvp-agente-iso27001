"""In-memory conversation history keyed by session_id.
For production, swap with a SQLite/PostgreSQL-backed store.
"""
from collections import defaultdict
from typing import Any

# session_id -> list of {"role": ..., "content": ...}
_sessions: dict[str, list[dict[str, Any]]] = defaultdict(list)
MAX_HISTORY = 20  # keep last N messages per session


def get_history(session_id: str) -> list[dict[str, Any]]:
    return _sessions[session_id]


def add_turn(session_id: str, role: str, content: str) -> None:
    _sessions[session_id].append({"role": role, "content": content})
    # Trim to keep context manageable
    if len(_sessions[session_id]) > MAX_HISTORY:
        _sessions[session_id] = _sessions[session_id][-MAX_HISTORY:]


def clear_session(session_id: str) -> None:
    _sessions.pop(session_id, None)
