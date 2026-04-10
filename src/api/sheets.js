import { get, put } from './client.js'

/** 특정 탭 데이터 조회 */
export const fetchSheet = (docId, sheetId) =>
  get(`/api/documents/${docId}/sheets/${sheetId}`)

/** 전체 탭 데이터 조회 */
export const fetchAllSheets = (docId) =>
  get(`/api/documents/${docId}/sheets`)

/** 탭 데이터 저장 */
export const saveSheet = (docId, sheetId, data) =>
  put(`/api/documents/${docId}/sheets/${sheetId}`, {
    sheet_id: sheetId,
    columns:  data.columns,
    rows:     data.rows,
  })
