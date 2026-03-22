import { useState, useCallback } from 'react'

const TOKEN_KEY = 'adminToken'

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')

  const login = useCallback(async (password) => {
    if (!password.trim()) throw new Error('La contraseña no puede estar vacía')
    const res = await fetch('/api/health')
    if (!res.ok) throw new Error('API no disponible. Verificá que el servidor esté corriendo.')
    localStorage.setItem(TOKEN_KEY, password)
    setToken(password)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken('')
  }, [])

  return { token, isAuthed: !!token, login, logout }
}
