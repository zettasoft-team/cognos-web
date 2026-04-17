import { useState, useRef, useCallback, useEffect } from 'react'
import { fetchDocuments, deleteDocuments, patchDocument, uploadDocuments } from '../api/documents.js'
import Notification from '../components/Notification.jsx'

const PAGE_SIZE = 10

/* ── 인라인 설명 편집 셀 ────────────────────────────────────── */
function DescriptionCell({ docId, value, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const save = async () => {
    setEditing(false)
    if (draft === value) return
    try { await patchDocument(docId, { description: draft }); onSaved(docId, draft) }
    catch  { setDraft(value) }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="desc-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        onClick={e => e.stopPropagation()}
      />
    )
  }
  return (
    <div
      className="desc-cell"
      title="클릭하여 수정"
      onClick={e => { e.stopPropagation(); setEditing(true) }}
    >
      {draft || <span className="desc-placeholder">설명 입력…</span>}
    </div>
  )
}

/* ── 메인 컴포넌트 ──────────────────────────────────────────── */
export default function DocumentList({ onOpen }) {
  const [docs, setDocs]             = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [checked, setChecked]       = useState(new Set())
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [notif, setNotif]           = useState(null)
  const [query, setQuery]           = useState('')
  const fileRef = useRef(null)

  const notify = useCallback((msg) => setNotif(msg), [])

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

  useEffect(() => {
    loadDocs(page)
  }, [page])

  /* 업로드 */
  const handleUpload = async (e) => {
    const files = [...e.target.files]
    if (!files.length) return
    e.target.value = ''
    try {
      await uploadDocuments(files)
      notify(`${files.length}개 파일 업로드 완료`)
      setPage(1); await loadDocs(1)
    } catch (e) { notify(`업로드 실패: ${e.message}`) }
  }

  /* 체크박스 */
  const toggleOne = (id) => setChecked(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = (e) => {
    if (e.target.checked) setChecked(prev => new Set([...prev, ...docs.map(d => d.uuid)]))
    else setChecked(prev => { const n = new Set(prev); docs.forEach(d => n.delete(d.uuid)); return n })
  }
  const allChecked  = docs.length > 0 && docs.every(d => checked.has(d.uuid))
  const someChecked = checked.size > 0

  /* 선택 삭제 */
  const handleDeleteSelected = async () => {
    if (!window.confirm(`선택한 ${checked.size}개 문서를 삭제하시겠습니까?`)) return
    try {
      await deleteDocuments([...checked])
      setChecked(new Set()); setPage(1); await loadDocs(1)
      notify('삭제 완료')
    } catch (e) { notify(`삭제 실패: ${e.message}`) }
  }

  /* 단건 삭제 */
  const handleDeleteOne = async (e, doc) => {
    e.stopPropagation()
    if (!window.confirm(`"​${doc.origin_file_name}"​를 삭제하시겠습니까?`)) return
    try {
      await deleteDocuments([doc.uuid])
      setChecked(prev => { const n = new Set(prev); n.delete(doc.uuid); return n })
      await loadDocs(page)
      notify('삭제 완료')
    } catch (e) { notify(`삭제 실패: ${e.message}`) }
  }

  /* 설명 저장 콜백 */
  const handleDescSaved = (docUuid, newDesc) => {
    setDocs(prev => prev.map(d => d.uuid === docUuid ? { ...d, description: newDesc } : d))
  }

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <div>
      {notif && <Notification msg={notif} onDone={() => setNotif(null)} />}

      {/* 페이지 헤더 */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <div className="page-title">Zmeta 메타 문서 관리</div>
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

      {/* 검색 행: 좌측 총개수, 우측 검색 박스 */}
      <div className="doc-search-row">
        <span className="doc-total-count">총 {docs.length}개</span>
        <div className="doc-search">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            placeholder="파일명, 프로젝트명 또는 설명으로 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="doc-search-clear" onClick={() => setQuery('')} aria-label="초기화">×</button>
          )}
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="doc-list-container">

        {/* 헤더열 */}
        <div className="doc-list-header doc-list-header-v2">
          <span className="col-check">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} />
          </span>
          <span className="col-seq">#</span>
          <span className="col-proj">Project</span>
          <span className="col-file">File</span>
          <span className="col-desc">Description</span>
          <span className="col-date">Upload</span>
          <span className="col-actions"></span>
        </div>

        {(() => {
          const q = query.trim().toLowerCase()
          const filtered = q
            ? docs.filter(d =>
                (d.origin_file_name || '').toLowerCase().includes(q) ||
                (d.project_name || '').toLowerCase().includes(q) ||
                (d.description || '').toLowerCase().includes(q))
            : docs
          if (loading) return <div className="empty-state"><div className="empty-title">불러오는 중…</div></div>
          if (docs.length === 0) return (
            <div className="empty-state">
              <div className="empty-title">업로드된 문서가 없습니다</div>
              <div>XML 파일을 업로드하면 목록에 표시됩니다.</div>
            </div>
          )
          if (filtered.length === 0) return (
            <div className="empty-state">
              <div className="empty-title">검색 결과가 없습니다</div>
              <div>다른 키워드로 검색해보세요.</div>
            </div>
          )
          return filtered.map(doc => (
            <div
              key={doc.uuid}
              className={`doc-list-row doc-list-row-v2${checked.has(doc.uuid) ? ' row-checked' : ''}`}
            >
              <span className="col-check" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={checked.has(doc.uuid)}
                  onChange={() => toggleOne(doc.uuid)}
                />
              </span>

              <span className="col-seq col-mono">{(page - 1) * PAGE_SIZE + docs.indexOf(doc) + 1}</span>

              <span className="col-proj">
                {doc.project_name
                  ? <span className="proj-name">{doc.project_name}</span>
                  : <span className="col-empty">—</span>}
              </span>

              <span
                className="col-file"
                onClick={() => onOpen(doc)}
                title={doc.origin_file_name}
              >
                {doc.origin_file_name}
              </span>

              <span className="col-desc">
                <DescriptionCell
                  docId={doc.uuid}
                  value={doc.description ?? ''}
                  onSaved={handleDescSaved}
                />
              </span>

              <span className="col-date col-mono">{doc.upload_date.slice(0, 10)}</span>

              <span className="col-actions" onClick={e => e.stopPropagation()}>
                <button className="row-btn-open" onClick={() => onOpen(doc)}>열기</button>
                <button className="row-btn-del"  onClick={e => handleDeleteOne(e, doc)}>삭제</button>
              </span>
            </div>
          ))
        })()}
      </div>

      {/* 하단: 선택 삭제 + 페이징 */}
      <div className="list-footer">
        <button
          className="btn btn-secondary btn-delete-selected"
          onClick={handleDeleteSelected}
          disabled={!someChecked}
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

