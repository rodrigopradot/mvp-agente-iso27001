import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setError('')
    try {
      await login(password)
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-glow" />
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-badge">
          <span className="login-badge__dot" />
          <span className="login-badge__text">SISTEMA ACTIVO · ISO 27001:2022</span>
        </div>

        <div className="login-logo">⬡</div>
        <h1 className="login-title">ISO 27001</h1>
        <p className="login-subtitle">KNOWLEDGE BASE AGENT</p>
        <p className="login-desc">Ingresá tu token de acceso para continuar.</p>

        <div className="login-field">
          <label className="login-field__label">TOKEN DE ACCESO</label>
          <input
            className={`login-input ${error ? 'login-input--error' : ''}`}
            type="password"
            placeholder="••••••••••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            disabled={loading}
          />
        </div>

        {error && (
          <div className="login-error">
            <span>⚠</span> {error}
          </div>
        )}

        <button
          className="login-btn"
          type="submit"
          disabled={loading || !password.trim()}
        >
          {loading ? 'VERIFICANDO...' : 'INGRESAR'}
        </button>

        <div className="login-footer">
          Agente especializado en ISO 27001:2022 · Powered by Groq
        </div>
      </form>
    </div>
  )
}
