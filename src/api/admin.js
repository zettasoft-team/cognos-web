import { get, post, patch, del } from './client.js'

const qs = (params) => {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) s.set(k, v)
  })
  const str = s.toString()
  return str ? `?${str}` : ''
}

// ── 사용자 관리 ──
export const fetchUsers = (page = 1, size = 10, q = '', role = '', status = '') =>
  get(`/api/admin/users${qs({ page, size, q, role, status })}`)

export const fetchUser = (id) => get(`/api/admin/users/${id}`)
export const createUser = (data) => post('/api/admin/users', data)
export const updateUser = (id, data) => patch(`/api/admin/users/${id}`, data)
export const deleteUser = (id) => del(`/api/admin/users/${id}`)
export const resetPassword = (id) => post(`/api/admin/users/${id}/reset-password`, {})
export const changeUserStatus = (id, status) => patch(`/api/admin/users/${id}/status`, { status })
export const assignUserRoles = (id, roleIds) => patch(`/api/admin/users/${id}/roles`, { role_ids: roleIds })

// ── 역할 관리 ──
export const fetchRoles = () => get('/api/admin/roles')
export const fetchRole = (id) => get(`/api/admin/roles/${id}`)
export const createRole = (data) => post('/api/admin/roles', data)
export const updateRole = (id, data) => patch(`/api/admin/roles/${id}`, data)
export const deleteRole = (id) => del(`/api/admin/roles/${id}`)
export const fetchPermissions = () => get('/api/admin/permissions')

// ── 마스터 데이터 ──
export const fetchMasterData = (type, page = 1, size = 20, q = '') =>
  get(`/api/admin/master/${type}${qs({ page, size, q })}`)

export const createMasterData = (type, data) =>
  post(`/api/admin/master/${type}`, data)

export const updateMasterData = (type, id, data) =>
  patch(`/api/admin/master/${type}/${id}`, data)

export const deleteMasterData = (type, id) =>
  del(`/api/admin/master/${type}/${id}`)
