import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import { fetchReports, deleteReports } from '../api/reports.js'

const PAGE_SIZE = 10
const STATUS_COLOR = { '게시됨': 'green', '임시저장': 'outline', '검토중': 'blue' }

export default function ReportsAdmin() {
  const [query, setQuery]       = useState('')
  const [checked, setChecked]   = useState(new Set())
  const [page, setPage]         = useState(1)
  const [data, setData]         = useState({ items: [], total: 0, total_pages: 1 })
  const [loading, setLoading]   = useState(false)

  const load = useCallback(async (p = 1, q = '') => {
    setLoading(true)
    try {
      const res = await fetchReports(p, PAGE_SIZE, q)
      setData(res)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(page, query) }, [page])

  const handleSearch = (e) => {
    setQuery(e.target.value)
    setPage(1)
    load(1, e.target.value)
  }

  const items = data.items
  const totalPages = data.total_pages || 1
  const currentPage = Math.min(page, totalPages)

  const toggleOne = (id) => setChecked(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  const toggleAll = (e) => {
    if (e.target.checked) setChecked(prev => new Set([...prev, ...items.map(r => r.id)]))
    else setChecked(prev => { const n = new Set(prev); items.forEach(r => n.delete(r.id)); return n })
  }
  const allChecked  = items.length > 0 && items.every(r => checked.has(r.id))
  const someChecked = checked.size > 0

  const handleDeleteSelected = async () => {
    if (!someChecked) return
    if (!window.confirm(`선택한 ${checked.size}개 보고서를 삭제하시겠습니까?`)) return
    try {
      await deleteReports([...checked])
      setChecked(new Set())
      load(currentPage, query)
    } catch { /* silent */ }
  }

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <>
      <div className="page-head flex items-center justify-between">
        <div>
          <div className="page-title">보고서 관리</div>
          <div className="page-desc">모델 변경 이력·편집 내역을 기반으로 보고서를 관리합니다.</div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary"><Icon name="download" size={14} />내보내기</button>
          <button className="btn btn-primary"><Icon name="plus" size={14} />새 보고서</button>
        </div>
      </div>

      {/* 좌: 총 개수 / 우: 검색 박스 */}
      <div className="list-meta-row">
        <span className="list-total-count">총 {data.total}개</span>
        <div className="search search-sm">
          <span className="icon"><Icon name="search" size={16} /></span>
          <input
            className="input"
            placeholder="제목 또는 작성자로 검색"
            value={query}
            onChange={handleSearch}
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(''); setPage(1); load(1, '') }} aria-label="초기화">×</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                </th>
                <th style={{ width: 48 }}>#</th>
                <th>제목</th>
                <th style={{ width: 90 }}>작성자</th>
                <th style={{ width: 110 }}>수정일</th>
                <th style={{ width: 80 }}>상태</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>불러오는 중…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>
                  {query ? '검색 결과가 없습니다.' : '등록된 보고서가 없습니다.'}
                </td></tr>
              ) : items.map((r, idx) => (
                <tr key={r.id} style={{ cursor: 'pointer' }}>
                  <td onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={checked.has(r.id)} onChange={() => toggleOne(r.id)} />
                  </td>
                  <td className="num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{r.title}</td>
                  <td>{r.author_name}</td>
                  <td className="mono muted">{(r.updated_at || '').slice(0, 10)}</td>
                  <td><span className={'badge ' + (STATUS_COLOR[r.status] || 'outline')}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 좌: 선택 삭제 / 우: 페이징 */}
      <div className="list-footer">
        <button className="btn btn-secondary btn-delete-selected" onClick={handleDeleteSelected} disabled={!someChecked}>
          선택 삭제{someChecked ? ` (${checked.size})` : ''}
        </button>
        <div className="pagination">
          <button className="page-btn" onClick={goPrev} disabled={currentPage === 1}>&lt;</button>
          <span className="page-info">{currentPage} / {totalPages}</span>
          <button className="page-btn" onClick={goNext} disabled={currentPage === totalPages}>&gt;</button>
        </div>
      </div>
    </>
  )
}
