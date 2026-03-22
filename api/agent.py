"""RAG agent using Groq API + ChromaDB for ISO 27001 Q&A."""
import os
from openai import OpenAI
from api.vectorstore import similarity_search
from api.conversation import get_history, add_turn

SYSTEM_PROMPT = """Eres un experto en ISO 27001 y seguridad de la información.
Tu objetivo es ayudar a organizaciones a entender y certificarse en ISO 27001:2022.

Reglas:
- Responde SOLO basándote en el contexto recuperado de la base de conocimiento.
- Si no tienes información suficiente, indícalo claramente y sugiere consultar la norma oficial.
- Cita el número de cláusula o control del Annex A cuando sea relevante (ej: "Cláusula 6.1.2", "Control A.8.1").
- Responde en el mismo idioma que el usuario.
- Sé preciso, conciso y práctico.
- No inventes información sobre requisitos o controles que no estén en el contexto."""


def _build_rag_prompt(question: str, context_docs: list) -> str:
    if not context_docs:
        context = "No se encontró contexto relevante en la base de conocimiento."
    else:
        context_parts = []
        for i, doc in enumerate(context_docs, 1):
            source = doc.metadata.get("source", "Desconocido")
            section = doc.metadata.get("section", "")
            header = f"[Fuente {i}: {source}"
            if section:
                header += f" — {section}"
            header += "]"
            context_parts.append(f"{header}\n{doc.page_content}")
        context = "\n\n---\n\n".join(context_parts)

    return f"""Contexto de la base de conocimiento ISO 27001:

{context}

---

Pregunta del usuario: {question}"""


def answer(question: str, session_id: str = "default") -> tuple[str, list[str]]:
    """
    Returns (answer_text, list_of_sources).
    """
    client = OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
    )

    # Retrieve relevant chunks
    docs = similarity_search(question, k=5)
    sources = list({doc.metadata.get("source", "") for doc in docs if doc.metadata.get("source")})

    # Build conversation messages
    history = get_history(session_id)
    user_content = _build_rag_prompt(question, docs)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *history,
        {"role": "user", "content": user_content},
    ]

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=2048,
        messages=messages,
    )
    response_text = response.choices[0].message.content

    # Persist conversation history (store original question, not augmented prompt)
    add_turn(session_id, "user", question)
    add_turn(session_id, "assistant", response_text)

    return response_text, sources
