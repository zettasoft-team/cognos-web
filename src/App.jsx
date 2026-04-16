import { useState, useEffect } from 'react'
import Shell from './layout/Shell.jsx'
import Login        from './pages/Login.jsx'
import Models       from './pages/Models.jsx'
import ReportsAdmin from './pages/ReportsAdmin.jsx'
import Requests     from './pages/Requests.jsx'
import Admin        from './pages/Admin.jsx'
import { logout, fetchMe, refreshToken, clearAccessToken } from './api/auth.js'

const screens = {
  models:   Models,
  reports:  ReportsAdmin,
  requests: Requests,
  admin:    Admin,
}

function getPageFromHash() {
  const h = location.hash.replace('#', '')
  return screens[h] ? h : 'models'
}

function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState(getPageFromHash)
  const [checking, setChecking] = useState(true)

  // 새로고침 시 refresh 쿠키로 세션 복구 시도
  useEffect(() => {
    refreshToken()
      .then(() => fetchMe())
      .then(u => setUser(u))
      .catch(() => clearAccessToken())
      .finally(() => setChecking(false))
  }, [])

  // hash ↔ page 동기화
  useEffect(() => {
    const onHash = () => setPage(getPageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (p) => { location.hash = p }

  const handleLogin = (u) => {
    setUser(u)
  }

  const handleLogout = async () => {
    await logout()
    clearAccessToken()
    setUser(null)
    navigate('models')
  }

  if (checking) return null

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const Screen = screens[page] || Models
  return (
    <Shell
      current={page}
      onNavigate={navigate}
      onLogout={handleLogout}
      user={user}
    >
      <Screen />
    </Shell>
  )
}

export default App
