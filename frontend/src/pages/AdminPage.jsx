import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const API = '/api'

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

async function apiFetch(path, opts = {}) {
  const adminToken = localStorage.getItem('adminToken') || ''
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
    ...opts,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function StatusDot({ status }) {
  const colors = { ok: 'green', error: 'red', loading: 'amber', idle: 'muted' }
  const c = colors[status] || 'muted'
  return <span className={`status-dot status-dot--${c}`} />
}

function Badge({ children, variant = 'default' }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

function Card({ title, children, className }) {
  return (
    <div className={cx('card', className)}>
      {title && (
        <div className="card__header">
          <span className="card__title">{title}</span>
        </div>
      )}
      <div className="card__body">{children}</div>
    </div>
  )
}

function StatBlock({ label, value, highlight }) {
  return (
    <div className={cx('stat-block', highlight && 'stat-block--highlight')}>
      <div className="stat-block__value">{value}</div>
      <div className="stat-block__label">{label}</div>
    </div>
  )
}

function UploadZone({ onIngest, loading }) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState([])
  const inputRef = useRef()

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      ['.pdf', '.txt', '.md'].some(ext => f.name.endsWith(ext))
    )
    setFiles(prev => [...prev, ...dropped])
  }, [])

  return (
    <div className="upload-section">
      <div
        className={cx('dropzone', dragging && 'dropzone--active')}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md"
          style={{ display: 'none' }}
          onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files)])}
        />
        <div className="dropzone__icon">⊕</div>
        <div className="dropzone__text">Arrastrá archivos o hacé click para seleccionar</div>
        <div className="dropzone__hint">PDF · TXT · MD — ISO 27001 documents</div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className="file-item">
              <span className="file-item__name">{f.name}</span>
              <span className="file-item__size">{(f.size / 1024).toFixed(1)} KB</span>
              <button className="file-item__remove" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <div className="file-list__actions">
            <span className="file-list__count">{files.length} archivo{files.length !== 1 ? 's' : ''} en cola</span>
            <button
              className="btn btn--amber"
              disabled={loading}
              onClick={() => onIngest(files).then(() => setFiles([]))}
            >
              {loading ? 'INDEXANDO...' : 'INDEXAR DOCUMENTOS'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LogTerminal({ lines }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [lines])

  return (
    <div className="terminal" ref={ref}>
      {lines.length === 0
        ? <span className="terminal__empty">Sistema listo. Esperando operaciones...</span>
        : lines.map((l, i) => (
            <div key={i} className={cx('terminal__line', `terminal__line--${l.type}`)}>
              <span className="terminal__ts">{l.ts}</span>
              <span className="terminal__msg">{l.msg}</span>
            </div>
          ))
      }
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row__label">{label}</span>
      <span className="info-row__value">{value}</span>
    </div>
  )
}

function EndpointRow({ method, path, desc }) {
  const colors = { GET: 'green', POST: 'amber', DELETE: 'red' }
  return (
    <div className="endpoint-row">
      <Badge variant={colors[method]?.toLowerCase() || 'default'}>{method}</Badge>
      <code className="endpoint-row__path">{path}</code>
      <span className="endpoint-row__desc">{desc}</span>
    </div>
  )
}

export default function AdminPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [health, setHealth] = useState(null)
  const [healthStatus, setHealthStatus] = useState('loading')
  const [activeTab, setActiveTab] = useState('overview')
  const [ingestLoading, setIngestLoading] = useState(false)
  const [logs, setLogs] = useState([])

  const addLog = (msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString('es-AR', { hour12: false })
    setLogs(prev => [...prev.slice(-99), { ts, msg, type }])
  }

  const fetchHealth = useCallback(async () => {
    setHealthStatus('loading')
    try {
      const data = await apiFetch('/health')
      setHealth(data)
      setHealthStatus('ok')
    } catch {
      setHealthStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    addLog('Conexión establecida con ISO 27001 KB API', 'success')
  }, [fetchHealth])

  const handleIngest = async (files) => {
    setIngestLoading(true)
    addLog(`Iniciando ingesta de ${files.length} archivo(s)...`, 'info')
    try {
      if (files.length > 0) {
        const adminToken = localStorage.getItem('adminToken') || ''
        const formData = new FormData()
        files.forEach(f => formData.append('files', f))
        const uploadRes = await fetch(`${API}/admin/upload`, {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
          body: formData,
        })
        if (!uploadRes.ok) {
          const err = await uploadRes.text()
          if (uploadRes.status === 401) {
            addLog('✗ Token inválido. Redirigiendo al login...', 'error')
            logout()
            navigate('/login')
            return
          }
          throw new Error(err)
        }
        const uploadData = await uploadRes.json()
        addLog(`↑ Archivos subidos: ${uploadData.saved.join(', ')}`, 'info')
      }
      const data = await apiFetch('/admin/ingest', {
        method: 'POST',
        body: JSON.stringify({ source_dir: './ingestion/sources' }),
      })
      addLog(`✓ Ingesta completada: ${data.documents_indexed} chunks indexados`, 'success')
      await fetchHealth()
    } catch (e) {
      addLog(`✗ Error en ingesta: ${e.message}`, 'error')
    } finally {
      setIngestLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'ingest', label: 'INGESTIÓN' },
    { id: 'logs', label: 'LOGS' },
  ]

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">⬡</div>
          <div className="sidebar__brand-text">
            <div className="sidebar__brand-name">ISO 27001</div>
            <div className="sidebar__brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          <Link className="nav-item nav-item--back" to="/chat">← Volver al Chat</Link>
          {tabs.map(t => (
            <button
              key={t.id}
              className={cx('nav-item', activeTab === t.id && 'nav-item--active')}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__status-row">
            <StatusDot status={healthStatus} />
            <span className="sidebar__status-label">
              {healthStatus === 'ok' ? 'API Online' : healthStatus === 'loading' ? 'Conectando...' : 'API Offline'}
            </span>
          </div>
          <button className="sidebar__refresh" onClick={fetchHealth}>↻ Refresh</button>
          <button
            className="sidebar__refresh"
            onClick={() => { logout(); navigate('/login') }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <span className="topbar__path">admin / {activeTab}</span>
          </div>
          <div className="topbar__right">
            <span className="topbar__docs">
              {health ? (
                <>{health.documents_indexed.toLocaleString()} <span className="topbar__docs-label">chunks indexados</span></>
              ) : '—'}
            </span>
          </div>
        </header>

        <div className="content">
          {activeTab === 'overview' && (
            <div className="tab-overview">
              <div className="overview__stats">
                <StatBlock label="Chunks Indexados" value={health?.documents_indexed ?? '—'} highlight={health?.documents_indexed > 0} />
                <StatBlock label="Estado API" value={healthStatus === 'ok' ? 'ONLINE' : 'OFFLINE'} highlight={healthStatus === 'ok'} />
                <StatBlock label="Modelo LLM" value="llama-3.1-8b" />
                <StatBlock label="Vector Store" value="ChromaDB" />
              </div>
              <div className="overview__grid">
                <Card title="SISTEMA">
                  <div className="info-list">
                    <InfoRow label="LLM" value="llama-3.1-8b-instant (Groq)" />
                    <InfoRow label="Embeddings" value="all-MiniLM-L6-v2 (local)" />
                    <InfoRow label="Vector DB" value="ChromaDB (local)" />
                    <InfoRow label="Framework" value="FastAPI + LangChain" />
                  </div>
                </Card>
                <Card title="ENDPOINTS DISPONIBLES">
                  <div className="endpoint-list">
                    <EndpointRow method="POST" path="/query" desc="Consulta directa al agente" />
                    <EndpointRow method="GET" path="/health" desc="Estado del sistema" />
                    <EndpointRow method="POST" path="/admin/ingest" desc="Trigger de ingesta" />
                    <EndpointRow method="POST" path="/admin/upload" desc="Subir documentos" />
                  </div>
                </Card>
              </div>
              <Card title="ACCIONES RÁPIDAS">
                <div className="quick-actions">
                  <button className="action-btn" onClick={fetchHealth}>
                    <span className="action-btn__icon">↻</span>
                    <span>Verificar salud API</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('ingest')}>
                    <span className="action-btn__icon">⊕</span>
                    <span>Ingestar documentos</span>
                  </button>
                  <Link className="action-btn" to="/chat">
                    <span className="action-btn__icon">▸</span>
                    <span>Ir al Chat</span>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'ingest' && (
            <div className="tab-ingest">
              <div className="tab__header">
                <h2 className="tab__title">INGESTIÓN DE DOCUMENTOS</h2>
                <p className="tab__desc">
                  Subí documentos ISO 27001 (PDFs, TXT, MD) para indexarlos en la base de conocimiento.
                </p>
              </div>
              <Card>
                <UploadZone onIngest={handleIngest} loading={ingestLoading} />
              </Card>
              <Card title="ARCHIVOS EN SERVIDOR">
                <p className="info-text">
                  Los archivos en <code className="code-inline">ingestion/sources/</code> del servidor también pueden ser indexados.
                </p>
                <div style={{ marginTop: '16px' }}>
                  <button className="btn btn--amber" disabled={ingestLoading} onClick={() => handleIngest([])}>
                    {ingestLoading ? 'PROCESANDO...' : '↺ RE-INDEXAR SOURCES/'}
                  </button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="tab-logs">
              <div className="tab__header-row">
                <h2 className="tab__title">LOGS DE OPERACIÓN</h2>
                <button className="btn btn--ghost btn--sm" onClick={() => setLogs([])}>LIMPIAR</button>
              </div>
              <Card>
                <LogTerminal lines={logs} />
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
