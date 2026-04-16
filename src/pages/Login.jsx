import { useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import { login } from '../api/auth.js'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('gjkim@zettasoft.co.kr')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(email, password)
      onLogin?.(res.user)
    } catch (err) {
      setError(err.message || '로그인 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="zt login-root">
      <div className="login-card card">
        <div className="login-brand">
          <div className="sidebar-logo" style={{ width: 40, height: 40, fontSize: 18 }}>C</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>CognosFM</div>
            <div className="muted" style={{ fontSize: 12 }}>Cognos BI 메타 관리 플랫폼</div>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 6,
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#b91c1c', fontSize: 12, marginBottom: 4
            }}>
              {error}
            </div>
          )}

          <label className="login-label">
            <span>이메일</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@zettasoft.co.kr"
              autoFocus
            />
          </label>

          <label className="login-label">
            <span>비밀번호</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
            />
          </label>

          <div className="flex items-center justify-between" style={{ fontSize: 12 }}>
            <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              로그인 상태 유지
            </label>
            <a className="card-link">비밀번호 찾기</a>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '10px 14px', fontSize: 14 }}
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className="login-footer muted">
          © 2026 ZettaSoft · v0.1.0
        </div>
      </div>
    </div>
  )
}
