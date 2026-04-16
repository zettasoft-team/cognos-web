import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import { fetchRequests } from '../api/requests.js'

const PAGE_SIZE = 10

const CATEGORY = { IDEA: ['blue', '아이디어'], BUG: ['red', '버그'] }
const STATUS   = { PENDING: ['outline', '대기'], IN_PROGRESS: ['blue', '진행중'], DONE: ['green', '완료'], REJECTED: ['red', '반려'] }
const TAG      = { PROJECT: '프로젝트', STAFFING: '인력', REPORT: '보고', SYSTEM: '시스템', OTHER: '기타' }
const PRIORITY = { HIGH: ['red', '높음'], MEDIUM: ['orange', '보통'], LOW: ['gray', '낮음'] }

const DEFAULT_STATUSES = ['PENDING', 'IN_PROGRESS']

export default function Requests() {
  const [cat, setCat]         = useState('ALL')
  const [tag, setTag]         = useState('ALL')
  const [prio, setPrio]       = useState('ALL')
  const [statuses, setStatuses] = useState(new Set(DEFAULT_STATUSES))
  const [page, setPage]       = useState(1)
  const [data, setData]       = useState({ items: [], total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(false)

  const toggleStatus = (s) => {
    setStatuses(prev => {
      const n = new Set(prev)
      n.has(s) ? n.delete(s) : n.add(s)
      return n
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filters = {}
      if (cat !== 'ALL') filters.category = cat
      if (tag !== 'ALL') filters.tag = tag
      if (prio !== 'ALL') filters.priority = prio
      if (statuses.size > 0) filters.status = [...statuses]
      const res = await fetchRequests(page, PAGE_SIZE, filters)
      setData(res)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [cat, tag, prio, statuses, page])

  useEffect(() => { load() }, [load])

  // 필터 변경 시 1페이지로
  useEffect(() => { setPage(1) }, [cat, tag, prio, statuses])

  const items = data.items
  const totalPages = data.total_pages || 1
  const currentPage = Math.min(page, totalPages)

  const goPrev = () => setPage(p => Math.max(1, p - 1))
  const goNext = () => setPage(p => Math.min(totalPages, p + 1))

  return (
    <>
      <div className="page-head flex items-center justify-between">
        <div>
          <div className="page-title">요청 게시판</div>
          <div className="page-desc">기능 아이디어나 버그를 자유롭게 등록해주세요.</div>
        </div>
        <button className="btn btn-primary"><Icon name="plus" size={14} />글 작성</button>
      </div>

      <div className="tabs">
        {[['ALL', '전체'], ['IDEA', '아이디어'], ['BUG', '버그']].map(([k, l]) => (
          <div key={k} className={'tab' + (cat === k ? ' active' : '')} onClick={() => setCat(k)}>{l}</div>
        ))}
      </div>

      <div className="toolbar">
        <div className="status-toggle">
          <span className="muted" style={{ fontSize: 11, marginRight: 4 }}>상태</span>
          {Object.entries(STATUS).map(([k, [, label]]) => (
            <button key={k} type="button"
              className={'status-chip' + (statuses.has(k) ? ' on' : '')}
              onClick={() => toggleStatus(k)}>
              {label}
            </button>
          ))}
        </div>

        <select className="select" value={tag} onChange={e => setTag(e.target.value)}>
          <option value="ALL">분야 전체</option>
          {Object.entries(TAG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select className="select" value={prio} onChange={e => setPrio(e.target.value)}>
          <option value="ALL">우선순위 전체</option>
          {Object.entries(PRIORITY).map(([k, [, v]]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 80 }}>카테고리</th>
                <th>제목</th>
                <th style={{ width: 80 }}>분야</th>
                <th style={{ width: 70 }}>우선순위</th>
                <th style={{ width: 80 }}>상태</th>
                <th style={{ width: 80 }}>작성자</th>
                <th style={{ width: 100 }}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>불러오는 중…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>등록된 요청이 없습니다.</td></tr>
              ) : items.map(p => {
                const [cv, cl] = CATEGORY[p.category] || ['outline', p.category]
                const [sv, sl] = STATUS[p.status] || ['outline', p.status]
                const [pv, pl] = PRIORITY[p.priority] || ['gray', p.priority]
                return (
                  <tr key={p.id} style={{ cursor: 'pointer' }}>
                    <td><span className={'badge ' + cv}>{cl}</span></td>
                    <td style={{ fontWeight: 500 }}>
                      {p.title}
                      {p.comments_count > 0 && <span className="muted" style={{ marginLeft: 6, fontSize: 11 }}>({p.comments_count})</span>}
                    </td>
                    <td><span className="badge secondary">{TAG[p.tag] || p.tag}</span></td>
                    <td><span className={'badge ' + pv}>{pl}</span></td>
                    <td><span className={'badge ' + sv}>{sl}</span></td>
                    <td>{p.author_name}</td>
                    <td className="mono muted">{(p.created_at || '').slice(0, 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 좌: 총 개수 / 우: 페이징 */}
      <div className="list-footer">
        <span className="list-total-count">총 {data.total}개</span>
        <div className="pagination">
          <button className="page-btn" onClick={goPrev} disabled={currentPage === 1}>&lt;</button>
          <span className="page-info">{currentPage} / {totalPages}</span>
          <button className="page-btn" onClick={goNext} disabled={currentPage === totalPages}>&gt;</button>
        </div>
      </div>
    </>
  )
}
