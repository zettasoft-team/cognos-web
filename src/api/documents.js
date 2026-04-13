import { get, del, upload, patch } from './client.js'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/** 문서 목록 조회 (페이징) */
export const fetchDocuments = (page = 1, size = 10) =>
  get(`/api/documents?page=${page}&size=${size}`)

/** 문서 단건 조회 */
export const fetchDocument = (docId) =>
  get(`/api/documents/${docId}`)

/** XML 업로드 */
export const uploadDocument = (file) => {
  const form = new FormData()
  form.append('file', file)
  return upload('/api/documents', form)
}

/** 설명 수정 */
export const patchDocument = (docId, data) =>
  patch(`/api/documents/${docId}`, data)

/** 선택 삭제 */
export const deleteDocuments = (ids) =>
  del('/api/documents', { ids })
