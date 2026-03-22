import os
import chromadb
from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
COLLECTION_NAME = "iso27001"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def get_embedding_function():
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def get_vectorstore() -> Chroma:
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)
    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embedding_function(),
        persist_directory=CHROMA_PERSIST_DIR,
    )


def similarity_search(query: str, k: int = 5) -> list[Document]:
    vs = get_vectorstore()
    return vs.similarity_search(query, k=k)


def add_documents(docs: list[Document]) -> int:
    vs = get_vectorstore()
    vs.add_documents(docs)
    return len(docs)


def collection_count() -> int:
    client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    try:
        col = client.get_collection(COLLECTION_NAME)
        return col.count()
    except Exception:
        return 0
