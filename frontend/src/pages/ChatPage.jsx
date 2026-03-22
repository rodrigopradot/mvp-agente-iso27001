import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sidebar } from 'react-pro-sidebar'
import { useAuth } from '../hooks/useAuth'
import { useChat } from '../hooks/useChat'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'

const EXAMPLE_QUESTIONS = [
  '¿Qué es el Annex A de ISO 27001?',
  '¿Cuáles son los documentos obligatorios?',
  '¿Qué cambió en la versión 2022?',
  '¿Cuánto lleva implementar el SGSI?',
]

const ISO_DOMAINS = [
  { icon: '🏛', code: 'A.5',  name: 'Políticas de SI',       pct: 85 },
  { icon: '👥', code: 'A.6',  name: 'Org. de la SI',         pct: 70 },
  { icon: '🔐', code: 'A.8',  name: 'Gestión de activos',    pct: 60 },
  { icon: '🛡', code: 'A.9',  name: 'Control de acceso',     pct: 90 },
  { icon: '🔒', code: 'A.10', name: 'Criptografía',          pct: 55 },
  { icon: '🖥', code: 'A.12', name: 'Seguridad operacional', pct: 75 },
  { icon: '🌐', code: 'A.13', name: 'Comunicaciones',        pct: 65 },
  { icon: '⚡', code: 'A.16', name: 'Gestión de incidentes', pct: 80 },
  { icon: '📋', code: 'A.18', name: 'Cumplimiento',          pct: 50 },
]

function SidebarBrand({ collapsed }) {
  return (
    <div className={`sidebar-brand${collapsed ? ' sidebar-brand--collapsed' : ''}`}>
      <div className="sidebar-brand__mark">⬡</div>
      {!collapsed && (
        <div>
          <div className="sidebar-brand__name">ISO 27001 Agent</div>
          <span className="sidebar-brand__tag">KNOWLEDGE BASE · 2022</span>
        </div>
      )}
    </div>
  )
}

function SidebarDomains({ collapsed, onSend }) {
  return (
    <div className="sidebar-section">
      {!collapsed && <span className="sidebar-section__label">DOMINIOS ISO 27001</span>}
      {ISO_DOMAINS.map(d => (
        <button
          key={d.code}
          className={`sidebar-domain${collapsed ? ' sidebar-domain--collapsed' : ''}`}
          onClick={() => onSend(`¿Cuéntame sobre el dominio ${d.code} – ${d.name} de ISO 27001?`)}
          title={collapsed ? `${d.code} – ${d.name}` : undefined}
        >
          <div className="sidebar-domain__icon">{d.icon}</div>
          {!collapsed && (
            <>
              <div className="sidebar-domain__info">
                <div className="sidebar-domain__name">{d.name}</div>
                <div className="sidebar-domain__code">{d.code}</div>
              </div>
              <div className="sidebar-domain__bar">
                <div className="sidebar-domain__bar-fill" style={{ width: `${d.pct}%` }} />
              </div>
            </>
          )}
        </button>
      ))}
    </div>
  )
}

function SidebarFooter({ collapsed, onNewConversation, onLogout }) {
  return (
    <div className="sidebar-footer">
      <div className="sidebar-status">
        <span className="status-dot status-dot--green" />
        {!collapsed && <span className="status-label">Agente activo</span>}
      </div>
      {!collapsed && (
        <div className="sidebar-actions">
          <button className="sidebar-action" onClick={onNewConversation}>
            ↺ Nueva conversación
          </button>
          <Link className="sidebar-action" to="/admin">
            ⬢ Panel de admin
          </Link>
          <button className="sidebar-action" onClick={onLogout}>
            → Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { logout } = useAuth()
  const { messages, loading, sendMessage, newConversation } = useChat()
const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const collapsed = !sidebarOpen

  return (
    <div className="chat-layout">
      {/* ── Sidebar wrapper ── */}
      <div className="sidebar-wrapper">
        <Sidebar
          collapsed={collapsed}
          width="260px"
          collapsedWidth="72px"
          transitionDuration={300}
          rootStyles={{
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border)',
            height: '100%',
          }}
        >
          <SidebarBrand collapsed={collapsed} />
          <SidebarDomains collapsed={collapsed} onSend={sendMessage} />
          <SidebarFooter collapsed={collapsed} onNewConversation={newConversation} onLogout={logout} />
        </Sidebar>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
      </div>

      {/* ── Header ── */}
      <header className="chat-header">
        <div className="chat-header__brand">
          <span className="chat-header__icon">◈</span>
          <div>
            <div className="chat-header__title">ISO 27001 Agent</div>
            <div className="chat-header__sub">Experto en seguridad de la información · ISO 27001:2022</div>
          </div>
        </div>
        <div className="chat-header__actions">
          <span className="status-dot status-dot--blue" style={{ marginRight: 4 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', marginRight: 12 }}>
            llama-3.1-8b via Groq
          </span>

<button className="chat-action-btn chat-action-btn--ghost" onClick={logout}>
            Salir
          </button>
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="chat-messages">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {loading && <ChatMessage isLoading />}
        <div ref={bottomRef} />
      </main>

      {/* ── Example questions (only on fresh conversation) ── */}
      {messages.length === 1 && !loading && (
        <div className="chat-examples">
          <span className="chat-examples__label">PREGUNTAS DE EJEMPLO</span>
          <div className="chat-examples__list">
            {EXAMPLE_QUESTIONS.map((q, i) => (
              <button key={i} className="chat-example-btn" onClick={() => sendMessage(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ── */}
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  )
}
