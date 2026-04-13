const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options)
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail ?? '요청 실패')
  }
  // 204 No Content 등 body 없는 경우
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export async function get(path)            { return request(path) }
export async function post(path, body)     { return request(path, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }
export async function put(path, body)      { return request(path, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }
export async function patch(path, body)    { return request(path, { method: 'PATCH',  headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }
export async function del(path, body)      { return request(path, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }

// 파일 다운로드 (Blob 반환)
export async function download(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error('다운로드 실패')
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="(.+?)"/)
  const filename = match ? match[1] : 'download'
  const blob = await res.blob()
  return { blob, filename }
}

// multipart/form-data 업로드
export async function upload(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', body: formData })
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(detail.detail ?? '업로드 실패')
  }
  return res.json()
}
