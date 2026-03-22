import { useState, useCallback } from 'react'

const WELCOME_MSG = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hola, soy tu experto en ISO 27001 y seguridad de la información. ¿En qué puedo ayudarte hoy?',
  sources: [],
}

export function useChat() {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())

  const sendMessage = useCallback(async (question) => {
    if (!question.trim() || loading) return

    const userMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      sources: [],
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, session_id: sessionId }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
      const data = await res.json()

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'error',
        content: e.message || 'Error al conectar con el agente',
        sources: [],
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, sessionId])

  const newConversation = useCallback(() => {
    setMessages([{
      ...WELCOME_MSG,
      id: crypto.randomUUID(),
      content: 'Nueva conversación iniciada. ¿En qué puedo ayudarte?',
    }])
    setSessionId(crypto.randomUUID())
  }, [])

  return { messages, loading, sendMessage, newConversation, sessionId }
}
