import { get, post, patch, del } from './client.js'

const qs = (params) => {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (Array.isArray(v)) v.forEach(x => s.append(k, x))
    else if (v !== '' && v !== undefined && v !== null) s.set(k, v)
  })
  const str = s.toString()
  return str ? `?${str}` : ''
}

// 게시글
export const fetchRequests = (page = 1, size = 10, filters = {}) =>
  get(`/api/requests${qs({ page, size, ...filters })}`)

export const fetchRequest = (id) =>
  get(`/api/requests/${id}`)

export const createRequest = (data) =>
  post('/api/requests', data)

export const updateRequest = (id, data) =>
  patch(`/api/requests/${id}`, data)

export const changeRequestStatus = (id, status) =>
  patch(`/api/requests/${id}/status`, { status })

export const deleteRequest = (id) =>
  del(`/api/requests/${id}`)

// 댓글
export const fetchComments = (reqId) =>
  get(`/api/requests/${reqId}/comments`)

export const createComment = (reqId, body) =>
  post(`/api/requests/${reqId}/comments`, { body })

export const updateComment = (reqId, commentId, body) =>
  patch(`/api/requests/${reqId}/comments/${commentId}`, { body })

export const deleteComment = (reqId, commentId) =>
  del(`/api/requests/${reqId}/comments/${commentId}`)
