import { get, post, patch, del } from './client.js'

const qs = (params) => {
  const s = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) s.set(k, v)
  })
  const str = s.toString()
  return str ? `?${str}` : ''
}

export const fetchReports = (page = 1, size = 10, q = '', status = '') =>
  get(`/api/reports${qs({ page, size, q, status })}`)

export const fetchReport = (id) =>
  get(`/api/reports/${id}`)

export const createReport = (data) =>
  post('/api/reports', data)

export const updateReport = (id, data) =>
  patch(`/api/reports/${id}`, data)

export const deleteReports = (ids) =>
  del('/api/reports', { ids })

export const publishReport = (id) =>
  post(`/api/reports/${id}/publish`, {})

export const submitReview = (id) =>
  post(`/api/reports/${id}/submit-review`, {})
