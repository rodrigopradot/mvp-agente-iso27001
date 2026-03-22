# ISO 27001 AI Agent

An AI-powered knowledge base and chat agent specialized in ISO 27001:2022 (Information Security Management). Ask questions in natural language and get accurate, cited answers grounded in your own ISO 27001 documentation.

Built with Retrieval-Augmented Generation (RAG): your documents are chunked, embedded locally, and stored in a vector database — no data leaves your infrastructure except the query sent to the Groq LLM API.

---

## Features

- **Chat interface** — conversational Q&A on ISO 27001:2022 with session history
- **Source citations** — every answer shows which document chunks it was retrieved from
- **Admin panel** — upload documents (PDF, TXT, MD) and trigger ingestion via drag & drop
- **Local vector store** — ChromaDB with sentence-transformers embeddings (no external embedding API)
- **Fast inference** — llama-3.1-8b-instant via Groq (free tier available)
- **Fully containerized** — one `docker-compose up` to run everything
- **Domain sidebar** — quick-access buttons for each ISO 27001 Annex A domain

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | llama-3.1-8b-instant via [Groq](https://console.groq.com) |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` (local) |
| Vector DB | ChromaDB (local persistence) |
| RAG | LangChain |
| Backend | FastAPI + Uvicorn |
| Frontend | React 18 + Vite |
| Styling | Custom CSS (light mode, Open Sans) |
| UI Components | react-pro-sidebar |
| Containers | Docker + Docker Compose |
| Web Server | Nginx (frontend) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser                             │
│   ┌──────────────────┐    ┌──────────────────────────┐  │
│   │   Chat UI        │    │   Admin Panel            │  │
│   │  (ChatPage.jsx)  │    │  (AdminPage.jsx)         │  │
│   └────────┬─────────┘    └───────────┬──────────────┘  │
└────────────┼──────────────────────────┼─────────────────┘
             │ /api/*                   │ /api/admin/*
             ▼                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Nginx (port 3000)                      │
│          reverse proxy → FastAPI (port 8000)            │
└─────────────────────────┬───────────────────────────────┘
                          │
             ┌────────────▼────────────┐
             │   FastAPI (api/)        │
             │   POST /query           │
             │   POST /admin/upload    │
             │   POST /admin/ingest    │
             └──────┬──────────┬───────┘
                    │          │
          ┌─────────▼──┐   ┌───▼──────────────────┐
          │  ChromaDB  │   │  Groq API            │
          │  (local)   │   │  llama-3.1-8b-instant│
          │  vector DB │   │  (LLM inference)     │
          └────────────┘   └──────────────────────┘
```

**Query flow:** User question → semantic search in ChromaDB → top-k relevant chunks → LLM prompt with context → streamed answer with citations.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A free [Groq API key](https://console.groq.com) (no credit card required)
- ISO 27001 documents in PDF, TXT, or MD format (you must provide your own)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/iso27001-agent.git
cd iso27001-agent

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set:
#   GROQ_API_KEY=your_groq_key
#   ADMIN_TOKEN=your_chosen_admin_password

# 3. Add your ISO 27001 documents
cp /path/to/your/iso27001_docs/*.pdf ingestion/sources/

# 4. Build and start
docker-compose up --build
```

The app will be available at **http://localhost:3000**.

Log in with the `ADMIN_TOKEN` you set in `.env`.

---

## Configuration

All configuration is done via environment variables in the `.env` file.

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | **Yes** | — | Groq API key for LLM inference. Get one free at [console.groq.com](https://console.groq.com) |
| `ADMIN_TOKEN` | **Yes** | — | Password for the admin panel. Use a strong random string. |
| `SECRET_KEY` | No | `change-me-in-production` | App secret key (used for future session signing) |
| `CHROMA_PERSIST_DIR` | No | `./data/chroma` | Path where ChromaDB stores vectors |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./data/conversations.db` | SQLAlchemy connection string for conversation history |

---

## Adding Documents

The agent answers questions based on documents you ingest. Follow these steps to add ISO 27001 material:

**Via Admin Panel (recommended):**
1. Go to `http://localhost:3000` and log in with your `ADMIN_TOKEN`
2. Click **Panel de admin** in the sidebar
3. Drag and drop PDF/TXT/MD files onto the upload area
4. Click **Ingestar documentos** to process them
5. The system will chunk, embed, and index them — progress is shown in the terminal log

**Via API:**
```bash
# Upload a file
curl -X POST http://localhost:8000/admin/upload \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -F "files=@/path/to/document.pdf"

# Trigger ingestion
curl -X POST http://localhost:8000/admin/ingest \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Supported formats:** `.pdf`, `.txt`, `.md`

**Recommended documents:**
- ISO/IEC 27001:2022 standard
- ISO/IEC 27002:2022 (controls guidance)
- Your organization's ISMS documentation
- Implementation guides and checklists

> **Note:** ISO/IEC standards are copyrighted by ISO. You must purchase or obtain them through official channels. This repository does not include the standards.

---

## API Reference

### `GET /health`
Returns system status and number of indexed documents.

```bash
curl http://localhost:8000/health
# {"status": "ok", "documents_indexed": 142}
```

### `POST /query`
Query the knowledge base.

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the mandatory documents required by ISO 27001:2022?",
    "session_id": "my-session-123"
  }'
```

Response:
```json
{
  "answer": "ISO 27001:2022 requires the following mandatory documented information...",
  "sources": ["iso27001_annex_a_summary.md", "NQA-Implementation-Guide.pdf"],
  "session_id": "my-session-123"
}
```

### `POST /admin/upload` *(requires auth)*
Upload documents for ingestion.

```bash
curl -X POST http://localhost:8000/admin/upload \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -F "files=@document.pdf"
```

### `POST /admin/ingest` *(requires auth)*
Process uploaded documents and index them in ChromaDB.

```bash
curl -X POST http://localhost:8000/admin/ingest \
  -H "x-admin-token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source_dir": "./ingestion/sources"}'
```

---

## Local Development (without Docker)

**Backend:**
```bash
python -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

pip install -r requirements.txt
cp .env.example .env           # fill in your values

uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173 with API proxy to :8000
```

The Vite dev server proxies `/api/*` requests to the backend automatically (configured in `vite.config.js`).

---

## Project Structure

```
iso27001-agent/
├── api/                        # FastAPI backend
│   ├── main.py                 # App entrypoint, routes, auth
│   ├── agent.py                # RAG pipeline, Groq integration
│   ├── vectorstore.py          # ChromaDB wrapper
│   ├── conversation.py         # In-memory session history
│   └── models.py               # Pydantic request/response schemas
│
├── ingestion/                  # Document processing pipeline
│   ├── ingest.py               # Main ingestion runner
│   ├── chunker.py              # Recursive character text splitter
│   └── sources/                # Drop your ISO 27001 docs here
│       ├── iso27001_annex_a_summary.md     (example)
│       └── iso27001_certification_guide.md (example)
│
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx   # Token auth
│   │   │   ├── ChatPage.jsx    # Main chat UI + sidebar
│   │   │   └── AdminPage.jsx   # Document management
│   │   ├── components/
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   └── SourcesBadge.jsx
│   │   └── hooks/
│   │       ├── useAuth.js      # Login state
│   │       └── useChat.js      # Message state + API calls
│   ├── Dockerfile              # Multi-stage: node builder + nginx
│   └── nginx.conf              # Reverse proxy config
│
├── data/                       # Runtime data (gitignored)
│   └── chroma/                 # Vector store (auto-created)
│
├── Dockerfile                  # Backend container
├── docker-compose.yml          # Orchestration
├── requirements.txt            # Python dependencies
├── .env.example                # Environment template
└── LICENSE                     # MIT
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Disclaimer

This project is not affiliated with or endorsed by ISO. ISO 27001 is a registered trademark of ISO (International Organization for Standardization). You are responsible for obtaining ISO/IEC standards through official channels and complying with their terms of use.
