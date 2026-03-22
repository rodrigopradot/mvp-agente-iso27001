import React from 'react'
import SourcesBadge from './SourcesBadge'

function LoadingDots() {
  return (
    <div className="chat-loading">
      <span /><span /><span />
    </div>
  )
}

export default function ChatMessage({ message, isLoading }) {
  if (isLoading) {
    return (
      <div className="chat-message chat-message--assistant">
        <div className="chat-avatar chat-avatar--assistant">⬡</div>
        <div className="chat-bubble chat-bubble--assistant">
          <LoadingDots />
        </div>
      </div>
    )
  }

  if (message.role === 'error') {
    return (
      <div className="chat-message chat-message--error">
        <div className="chat-avatar chat-avatar--error">!</div>
        <div className="chat-bubble chat-bubble--error">
          <span className="chat-error-icon">⚠</span> {message.content}
        </div>
      </div>
    )
  }

  if (message.role === 'user') {
    return (
      <div className="chat-message chat-message--user">
        <div className="chat-bubble chat-bubble--user">{message.content}</div>
        <div className="chat-avatar chat-avatar--user">U</div>
      </div>
    )
  }

  return (
    <div className="chat-message chat-message--assistant">
      <div className="chat-avatar chat-avatar--assistant">⬡</div>
      <div className="chat-bubble-wrapper">
        <div className="chat-bubble chat-bubble--assistant">
          <p className="chat-text">{message.content}</p>
        </div>
        {message.sources && message.sources.length > 0 && (
          <SourcesBadge sources={message.sources} />
        )}
      </div>
    </div>
  )
}
