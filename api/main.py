"""FastAPI application — ISO 27001 Knowledge Base API."""
import os
import hashlib
import hmac
import shutil
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from api.models import (
    QueryRequest,
    QueryResponse,
    IngestRequest,
    IngestResponse,
)
from api.agent import answer
from api.vectorstore import collection_count


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("./data/chroma", exist_ok=True)
    yield


app = FastAPI(
    title="ISO 27001 Knowledge Base API",
    description="Agente autónomo para consultas sobre certificación ISO 27001",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth helpers ──────────────────────────────────────────────────────────────

def verify_admin_token(x_admin_token: str = Header(...)):
    expected = os.getenv("ADMIN_TOKEN", "")
    if not expected or not hmac.compare_digest(x_admin_token, expected):
        raise HTTPException(status_code=401, detail="Invalid admin token")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "documents_indexed": collection_count()}


@app.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    """Query the ISO 27001 knowledge base."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")
    response_text, sources = answer(req.question, session_id=req.session_id or "default")
    return QueryResponse(
        answer=response_text,
        sources=sources,
        session_id=req.session_id or "default",
    )


@app.post("/admin/upload")
def upload_files(
    files: list[UploadFile] = File(...),
    _: None = Depends(verify_admin_token),
):
    """Upload documents to ingestion/sources/ (admin only)."""
    ALLOWED = {".pdf", ".txt", ".md"}
    sources_dir = Path("./ingestion/sources")
    sources_dir.mkdir(parents=True, exist_ok=True)

    saved = []
    for upload in files:
        suffix = Path(upload.filename).suffix.lower()
        if suffix not in ALLOWED:
            continue
        dest = sources_dir / upload.filename
        with dest.open("wb") as f:
            shutil.copyfileobj(upload.file, f)
        saved.append(upload.filename)

    return {"status": "ok", "saved": saved}


@app.post("/admin/ingest", response_model=IngestResponse)
def trigger_ingest(
    req: IngestRequest,
    _: None = Depends(verify_admin_token),
):
    """Trigger document ingestion (admin only)."""
    from ingestion.ingest import run_ingestion

    source_dir = req.source_dir or "./ingestion/sources"
    count = run_ingestion(source_dir)
    return IngestResponse(status="ok", documents_indexed=count)
