/**
 * 인증 API + 토큰 관리.
 * access_token 은 메모리(변수)에만 보관, refresh 는 HttpOnly 쿠키로 서버가 관리.
 */
import { get, post } from './client.js'

let _accessToken = null

/** 현재 access token 반환 (없으면 null) */
export function getAccessToken() { return _accessToken }

/** 토큰 세팅 (login/refresh 성공 시 호출) */
export function setAccessToken(token) {
  _accessToken = token
  window.__cognosfm_access_token = token // client.js 에서 참조
}

/** 토큰 제거 */
export function clearAccessToken() {
  _accessToken = null
  window.__cognosfm_access_token = null
}

// ── endpoints ───────────────────────────────────────────

export async function login(email, password) {
  const res = await post('/api/auth/login', { email, password })
  setAccessToken(res.access_token)
  return res // { access_token, token_type, expires_at, user }
}

export async function refreshToken() {
  const res = await post('/api/auth/refresh', {})
  setAccessToken(res.access_token)
  return res
}

export async function logout() {
  try { await post('/api/auth/logout', {}) } catch { /* ignore */ }
  clearAccessToken()
}

export async function fetchMe() {
  return get('/api/auth/me')
}

export async function changePassword(currentPassword, newPassword) {
  return post('/api/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
}
