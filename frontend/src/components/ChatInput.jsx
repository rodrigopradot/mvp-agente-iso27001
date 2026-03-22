import React, { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="chat-input-area">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Escribe tu pregunta sobre ISO 27001... (Enter para enviar, Shift+Enter para nueva línea)"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          title="Enviar (Enter)"
        >
          {disabled ? (
            <span className="chat-send-spinner" />
          ) : (
            <span>▶</span>
          )}
        </button>
      </div>
      <div className="chat-input-hint">
        Modelo: llama-3.1-8b-instant via Groq · ISO 27001:2022
      </div>
    </div>
  )
}
