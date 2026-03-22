"""
ISO 27001 Knowledge Base — Document ingestion pipeline.

Supported file types:
- PDF (.pdf)    → pdfplumber
- Text (.txt)   → plain text
- Markdown (.md)→ plain text

Place source documents in ingestion/sources/ and run:
    python -m ingestion.ingest
"""
import os
import sys
from pathlib import Path

import pdfplumber
from langchain_core.documents import Document

from ingestion.chunker import chunk_documents
from api.vectorstore import add_documents


def load_pdf(path: Path) -> list[Document]:
    docs = []
    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            text = page.extract_text()
            if text and text.strip():
                docs.append(Document(
                    page_content=text.strip(),
                    metadata={
                        "source": path.name,
                        "page": page_num,
                        "file_type": "pdf",
                    }
                ))
    return docs


def load_text(path: Path) -> list[Document]:
    content = path.read_text(encoding="utf-8", errors="ignore").strip()
    if not content:
        return []
    return [Document(
        page_content=content,
        metadata={
            "source": path.name,
            "file_type": path.suffix.lstrip("."),
        }
    )]


def load_file(path: Path) -> list[Document]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return load_pdf(path)
    elif suffix in (".txt", ".md"):
        return load_text(path)
    else:
        print(f"  Skipping unsupported file type: {path.name}")
        return []


def run_ingestion(source_dir: str = "./ingestion/sources") -> int:
    source_path = Path(source_dir)
    if not source_path.exists():
        print(f"Source directory not found: {source_dir}")
        return 0

    all_docs: list[Document] = []
    files = list(source_path.rglob("*.*"))

    if not files:
        print(f"No files found in {source_dir}")
        return 0

    for file_path in files:
        if not file_path.is_file():
            continue
        print(f"Loading: {file_path.name}")
        docs = load_file(file_path)
        print(f"  → {len(docs)} pages/sections extracted")
        all_docs.extend(docs)

    if not all_docs:
        print("No content extracted from files.")
        return 0

    print(f"\nChunking {len(all_docs)} documents...")
    chunks = chunk_documents(all_docs)
    print(f"Created {len(chunks)} chunks")

    print("Generating embeddings and storing in ChromaDB...")
    count = add_documents(chunks)
    print(f"Done. {count} chunks indexed.")
    return count


if __name__ == "__main__":
    source = sys.argv[1] if len(sys.argv) > 1 else "./ingestion/sources"
    run_ingestion(source)
