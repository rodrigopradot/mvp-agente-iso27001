FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/
COPY ingestion/ ./ingestion/

RUN mkdir -p /app/data/chroma

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
