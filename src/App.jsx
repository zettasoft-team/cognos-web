import { useState, useEffect } from 'react'
import Shell from './layout/Shell.jsx'
import Login        from './pages/Login.jsx'
import Models       from './pages/Models.jsx'
import ReportsAdmin from './pages/ReportsAdmin.jsx'
import Requests     from './pages/Requests.jsx'
import Admin        from './pages/Admin.jsx'
import { logout, fetchMe, setAccessToken, clearAccessToken } from './api/auth.js'

const screens = {
  models:   Models,
  reports:  ReportsAdmin,
  requests: Requests,
  admin:    Admin,
}

function App() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('models')
  const [checking, setChecking] = useState(true)

  // 새로고침 시 refresh 쿠키로 세션 복구 시도
  useEffect(() => {
    fetchMe()
      .then(u => { setUser(u); setAccessToken(window.__cognosfm_access_token) })
      .catch(() => clearAccessToken())
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = (u) => {
    setUser(u)
  }

  const handleLogout = async () => {
    await logout()
    clearAccessToken()
    setUser(null)
    setPage('models')
  }

  if (checking) return null

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const Screen = screens[page] || Models
  return (
    <Shell
      current={page}
      onNavigate={setPage}
      onLogout={handleLogout}
      user={user}
    >
      <Screen />
    </Shell>
  )
}

export default App
