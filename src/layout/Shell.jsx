import { useState } from 'react'
import { Icon } from '../components/Icon.jsx'

const menu = [
  {
    items: [
      { key: 'models',   icon: 'folder', title: '모델' },
      { key: 'reports',  icon: 'report', title: '보고서 관리' },
      { key: 'requests', icon: 'task',   title: '요청 게시판' },
    ],
  },
  {
    label: '관리',
    items: [
      { key: 'admin', icon: 'settings', title: '관리자' },
    ],
  },
]

export default function Shell({ current, onNavigate, onLogout, user, children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="zt">
      <div className="shell">
        <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
          <div className="sidebar-header">
            {collapsed ? (
              /* 접힌 상태: 로고 대신 펼치기 버튼 */
              <button
                className="sidebar-toggle"
                onClick={() => setCollapsed(false)}
                title="사이드바 펼치기"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            ) : (
              /* 펼친 상태: 로고 + 타이틀 + 접기 버튼 */
              <>
                <div className="sidebar-logo">Z</div>
                <div>Zmeta</div>
                <button
                  className="sidebar-toggle"
                  onClick={() => setCollapsed(true)}
                  title="사이드바 접기"
                >
                  <Icon name="chevron-left" size={14} />
                </button>
              </>
            )}
          </div>

          <nav className="sidebar-nav">
            {menu.map((group, i) => (
              <div key={i} className="sidebar-group">
                {group.label && !collapsed && <div className="sidebar-group-label">{group.label}</div>}
                {group.items.map(item => (
                  <div
                    key={item.key}
                    className={'sidebar-item' + (current === item.key ? ' active' : '')}
                    onClick={() => onNavigate(item.key)}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon name={item.icon} />
                    {!collapsed && <span>{item.title}</span>}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || user?.email || '사용자'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--zt-muted-fg)' }}>{user?.role || 'USER'}</div>
              </div>
            )}
            <button className="btn btn-ghost btn-sm" title="로그아웃" onClick={onLogout}>
              <Icon name="logout" size={14} />
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="content">{children}</div>
        </main>
      </div>
    </div>
  )
}
