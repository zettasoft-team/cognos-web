import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchDocuments, uploadDocument, deleteDocuments } from '../api/documents.js'
import Notification from '../components/Notification.jsx'

const PAGE_SIZE = 10

export default function DocumentList({ onOpen }) {
  const [docs, setDocs]         = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [checked, setChecked]   = useState(new Set())
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(false)
  const [notif, setNotif]       = useState(null)
  const fileRef = useRef(null)

  const notify = useCallback((msg) => setNotif(msg), [])

  /* 목록 조회 */
  const loadDocs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetchDocuments(p, PAGE_SIZE)
      setDocs(res.items)
      setTotalPages(res.total_pages)
    } catch (e) {
      notify(`목록 조회 실패: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => { loadDocs(page) }, [page])

  /* 업로드 */
  const handleUpload = async (e) => {
    const files = [...e.target.files]
    if (!files.length) return
    e.target.value = ''
    try {
      const form = new FormData()
      files.forEach(f => form.append('files', f))
      await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/api/documents`, {
        method: 'POST',
        body: form,
      }).then(r => r.json())
      notify(`${files.length}개 파일 업로드 완료`)
      setPage(1)
      await loadDocs(1)
    } catch (e) {
      notify(`업로드 실패: ${e.message}`)
    }
  }

  /* 체크박스 - 현재 페이지 기준 */
  const toggleOne = (id) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = (e) => {
    if (e.target.checked) {
      setChecked(prev => new Set([...prev, ...docs.map(d => d.id)]))
    } else {
      setChecked(prev => {
        const next = new Set(prev)
        docs.forEach(d => next.delete(d.id))
        return next
      })
    }
  }

  const allChecked  = docs.length > 0 && docs.every(d => checked.has(d.id))
  const someChecked = checked.size > 0

  /* 선택 삭제 */
  const handleDeleteSelected = async () => {
    if (!window.confirm(`선택한 ${checked.size}개 문서를 삭제하시겠습니까?`)) return
    try {
      await deleteDocuments([...checked])
      setChecked(new Set())
      setPage(1)
      await loadDocs(1)
      notify('삭제 완료')
    } catch (e) {
      notify(`삭제 실패: ${e.message}`)
    }
  }

  /* 페이지 이동 */
  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <div>
      {notif && <Notification msg={notif} onDone={() => setNotif(null)} />}

      {/* 페이지 헤더 */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <div className="page-title">Cognos BI 메타 문서 관리</div>
            <div className="page-subtitle">XML 업로드 · 테이블 편집 · XML 재생성 · ERD 시각화</div>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => fileRef.current.click()}>
              + XML 업로드
            </button>
            <input type="file" ref={fileRef} accept=".xml" multiple onChange={handleUpload} />
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="doc-list-container">
        <div className="doc-list-header">
          <span className="col-check">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} />
          </span>
          <span>파일명</span>
          <span>업로드 일시</span>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-title">불러오는 중...</div></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">업로드된 문서가 없습니다</div>
            <div>XML 파일을 업로드하면 목록에 표시됩니다.</div>
          </div>
        ) : (
          docs.map(doc => (
            <div
              key={doc.id}
              className={`doc-list-row${checked.has(doc.id) ? ' row-checked' : ''}`}
            >
              <span className="col-check" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={checked.has(doc.id)}
                  onChange={() => toggleOne(doc.id)}
                />
              </span>
              <div className="doc-filename" onClick={() => onOpen(doc)}>
                {doc.name}
              </div>
              <div className="doc-date">{doc.upload_date}</div>
            </div>
          ))
        )}
      </div>

      {/* 하단: 선택 삭제 + 페이징 */}
      <div className="list-footer">
        <button
          className="btn btn-delete-selected"
          disabled={!someChecked}
          onClick={handleDeleteSelected}
        >
          선택 삭제{someChecked ? ` (${checked.size})` : ''}
        </button>

        <div className="pagination">
          <button className="page-btn" onClick={goPrev} disabled={page === 1}>&lt;</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" onClick={goNext} disabled={page === totalPages}>&gt;</button>
        </div>
      </div>
    </div>
  )
}
