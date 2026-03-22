import React from 'react'

export default function SourcesBadge({ sources }) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="sources-row">
      <span className="sources-label">FUENTES</span>
      {sources.map((s, i) => (
        <span key={i} className="source-badge" title={s}>
          {s.split('/').pop()}
        </span>
      ))}
    </div>
  )
}
