import { get, download, upload } from './client.js'

/** ERD 데이터 조회 */
export const fetchErd = (docId) =>
  get(`/api/documents/${docId}/erd`)

/** 트리 구조 조회 */
export const fetchTree = (docId) =>
  get(`/api/documents/${docId}/tree`)

/** Excel 다운로드 */
export const exportExcel = async (docId) => {
  const { blob, filename } = await download(`/api/documents/${docId}/export/excel`)
  triggerDownload(blob, filename)
}

/** Excel 업로드 */
export const importExcel = (docId, file) => {
  const form = new FormData()
  form.append('file', file)
  return upload(`/api/documents/${docId}/import/excel`, form)
}

/** Zmeta XML 재생성 다운로드 */
export const exportXml = async (docId) => {
  const { blob, filename } = await download(`/api/documents/${docId}/export/xml`)
  triggerDownload(blob, filename)
}

/** 원본 XML 다운로드 */
export const exportOriginXml = async (docId) => {
  const { blob, filename } = await download(`/api/documents/${docId}/export/origin`)
  triggerDownload(blob, filename)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
