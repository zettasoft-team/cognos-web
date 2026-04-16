import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../components/Icon.jsx'
import {
  fetchUsers, deleteUser, resetPassword, changeUserStatus,
  fetchRoles, deleteRole,
  fetchMasterData, deleteMasterData,
} from '../api/admin.js'

const PAGE_SIZE = 10

const TABS = [
  { key: 'users', label: '사용자 관리' },
  { key: 'roles', label: '권한 관리' },
  { key: 'meta',  label: '모델 지원 데이터' },
]

// ── 사용자 관리 탭 ──
function UsersTab() {
  const [data, setData]       = useState({ items: [], total: 0, total_pages: 1 })
  const [page, setPage]       = useState(1)
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p = 1, q = '') => {
    setLoading(true)
    try { setData(await fetchUsers(p, PAGE_SIZE, q)) } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(page, query) }, [page])

  const handleSearch = (e) => { setQuery(e.target.value); setPage(1); load(1, e.target.value) }

  const handleReset = async (id) => {
    if (!window.confirm('비밀번호를 초기화하시겠습니까?')) return
    try {
      const res = await resetPassword(id)
      window.alert(`임시 비밀번호: ${res.temp_password}`)
    } catch { /* silent */ }
  }

  const handleToggleStatus = async (user) => {
    const next = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    if (!window.confirm(`${user.name}을 ${next}로 변경하시겠습니까?`)) return
    try { await changeUserStatus(user.id, next); load(page, query) } catch { /* silent */ }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`${user.name}을 삭제하시겠습니까?`)) return
    try { await deleteUser(user.id); load(page, query) } catch { /* silent */ }
  }

  const items = data.items
  const totalPages = data.total_pages || 1

  return (
    <>
      <div className="list-meta-row">
        <span className="list-total-count">총 {data.total}명</span>
        <div className="search search-sm">
          <span className="icon"><Icon name="search" size={16} /></span>
          <input className="input" placeholder="이름 또는 이메일 검색" value={query} onChange={handleSearch} />
          {query && <button className="search-clear" onClick={() => { setQuery(''); setPage(1); load(1, '') }}>×</button>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 48 }}>#</th>
                <th>이름</th>
                <th>이메일</th>
                <th style={{ width: 80 }}>역할</th>
                <th style={{ width: 80 }}>상태</th>
                <th style={{ width: 60 }}>잠금</th>
                <th style={{ width: 150 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>불러오는 중…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>사용자가 없습니다.</td></tr>
              ) : items.map((u, i) => (
                <tr key={u.id}>
                  <td className="num">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td className="mono">{u.email}</td>
                  <td><span className="badge secondary">{u.role}</span></td>
                  <td><span className={'badge ' + (u.status === 'ACTIVE' ? 'green' : 'red')}>{u.status}</span></td>
                  <td>{u.is_locked ? <span className="badge red">잠금</span> : '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleReset(u.id)} title="비밀번호 초기화">초기화</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(u)} title="상태 변경">
                        {u.status === 'ACTIVE' ? '비활성' : '활성'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(u)} title="삭제" style={{ color: 'var(--zt-red)' }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="list-footer">
        <span className="list-total-count" />
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&gt;</button>
        </div>
      </div>
    </>
  )
}

// ── 권한 관리 탭 ──
function RolesTab() {
  const [roles, setRoles]     = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRoles(await fetchRoles()) } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [])

  const handleDelete = async (r) => {
    if (!window.confirm(`"${r.name}" 역할을 삭제하시겠습니까?`)) return
    try { await deleteRole(r.id); load() } catch { /* silent */ }
  }

  return (
    <>
      <div className="list-meta-row">
        <span className="list-total-count">총 {roles.length}개</span>
        <button className="btn btn-primary btn-sm"><Icon name="plus" size={14} />역할 추가</button>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>역할명</th>
                <th>설명</th>
                <th>권한</th>
                <th style={{ width: 80 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>불러오는 중…</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={4} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>등록된 역할이 없습니다.</td></tr>
              ) : roles.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td className="muted">{r.description || '-'}</td>
                  <td>
                    {(r.permissions || []).map(p => (
                      <span key={p} className="badge secondary" style={{ marginRight: 4, marginBottom: 2 }}>{p}</span>
                    ))}
                    {(!r.permissions || r.permissions.length === 0) && <span className="muted">-</span>}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r)} style={{ color: 'var(--zt-red)' }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── 모델 지원 데이터 탭 ──
function MasterTab() {
  const TYPES = [
    { key: 'data-sources', label: '데이터 소스' },
    { key: 'categories',   label: '카테고리' },
    { key: 'tags',         label: '태그' },
  ]
  const [activeType, setActiveType] = useState('data-sources')
  const [data, setData]       = useState({ items: [], total: 0, total_pages: 1 })
  const [page, setPage]       = useState(1)
  const [query, setQuery]     = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (t = activeType, p = 1, q = '') => {
    setLoading(true)
    try { setData(await fetchMasterData(t, p, 20, q)) } catch { /* silent */ }
    finally { setLoading(false) }
  }, [activeType])

  useEffect(() => { setPage(1); setQuery(''); load(activeType, 1, '') }, [activeType])
  useEffect(() => { load(activeType, page, query) }, [page])

  const handleSearch = (e) => { setQuery(e.target.value); setPage(1); load(activeType, 1, e.target.value) }

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.name}" 을 삭제하시겠습니까?`)) return
    try { await deleteMasterData(activeType, item.id); load(activeType, page, query) } catch { /* silent */ }
  }

  const items = data.items
  const totalPages = data.total_pages || 1

  return (
    <>
      <div className="tabs" style={{ marginBottom: 12 }}>
        {TYPES.map(t => (
          <div key={t.key} className={'tab' + (activeType === t.key ? ' active' : '')} onClick={() => setActiveType(t.key)}>{t.label}</div>
        ))}
      </div>

      <div className="list-meta-row">
        <span className="list-total-count">총 {data.total}개</span>
        <div className="search search-sm">
          <span className="icon"><Icon name="search" size={16} /></span>
          <input className="input" placeholder="이름 또는 코드 검색" value={query} onChange={handleSearch} />
          {query && <button className="search-clear" onClick={() => { setQuery(''); setPage(1); load(activeType, 1, '') }}>×</button>}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ border: 'none' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 120 }}>코드</th>
                <th>이름</th>
                <th>설명</th>
                <th style={{ width: 60 }}>순서</th>
                <th style={{ width: 80 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>불러오는 중…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} style={{ height: 80, textAlign: 'center', color: 'var(--zt-muted-fg)' }}>등록된 데이터가 없습니다.</td></tr>
              ) : items.map(m => (
                <tr key={m.id}>
                  <td className="mono">{m.code}</td>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td className="muted">{m.description || '-'}</td>
                  <td className="num">{m.sort_order}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(m)} style={{ color: 'var(--zt-red)' }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="list-footer">
        <span className="list-total-count" />
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>&lt;</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>&gt;</button>
        </div>
      </div>
    </>
  )
}

// ── 메인 ──
export default function Admin() {
  const [active, setActive] = useState('users')

  return (
    <>
      <div className="page-head">
        <div className="page-title">관리자</div>
        <div className="page-desc">시스템 운영에 필요한 설정을 관리합니다.</div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <div key={t.key} className={'tab' + (active === t.key ? ' active' : '')} onClick={() => setActive(t.key)}>
            {t.label}
          </div>
        ))}
      </div>

      {active === 'users' && <UsersTab />}
      {active === 'roles' && <RolesTab />}
      {active === 'meta'  && <MasterTab />}
    </>
  )
}
