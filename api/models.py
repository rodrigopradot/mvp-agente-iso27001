from pydantic import BaseModel
from typing import Optional


class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = "default"


class QueryResponse(BaseModel):
    answer: str
    sources: list[str] = []
    session_id: str


# ── Admin models ──────────────────────────────────────────────────────────────

class IngestRequest(BaseModel):
    source_dir: Optional[str] = None


class IngestResponse(BaseModel):
    status: str
    documents_indexed: int
