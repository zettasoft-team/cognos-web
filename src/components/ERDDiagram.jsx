/**
 * Interactive ERD Diagram
 * 레퍼런스: HTML_ERD_Generator 기술 레퍼런스
 * - 도메인 그룹 박스 + Greedy Column Packing 레이아웃
 * - 직각(Orthogonal) 관계선 + Crow's Foot 표기
 * - Pan/Zoom (마우스 휠 + 드래그)
 * - 호버 시 연관 테이블 하이라이트
 */
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'

// ── 레이아웃 상수 ───────────────────────────────────────────────────────────
const NODE_W    = 200
const COL_H     = 18
const HEADER_H  = 32
const PAD       = 22
const PAD_TOP   = 38
const GAP       = 30
const GROUP_GAP = 44
const CF_S      = 8   // crow's foot 크기

const DOMAIN_PALETTE = [
  { main: '#3b82f6', bg: 'rgba(59,130,246,0.06)',  bd: '#bfdbfe' },
  { main: '#10b981', bg: 'rgba(16,185,129,0.06)',  bd: '#a7f3d0' },
  { main: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  bd: '#fde68a' },
  { main: '#8b5cf6', bg: 'rgba(139,92,246,0.06)',  bd: '#ddd6fe' },
  { main: '#ef4444', bg: 'rgba(239,68,68,0.06)',   bd: '#fecaca' },
  { main: '#06b6d4', bg: 'rgba(6,182,212,0.06)',   bd: '#a5f3fc' },
  { main: '#ec4899', bg: 'rgba(236,72,153,0.06)',  bd: '#fbcfe8' },
]

// ── 높이 계산 ────────────────────────────────────────────────────────────────
function tblH(cols) { return HEADER_H + 16 + cols.length * COL_H }

// ── 레이아웃 계산 ────────────────────────────────────────────────────────────
function computeLayout(tables, domains) {
  // deep copy
  const tbls = {}
  for (const [k, v] of Object.entries(tables)) {
    tbls[k] = { ...v, cols: [...v.cols] }
  }

  const domainColor = {}
  domains.forEach((d, i) => { domainColor[d] = DOMAIN_PALETTE[i % DOMAIN_PALETTE.length] })

  // domain → table names
  const domainTables = {}
  for (const [name, t] of Object.entries(tbls)) {
    if (!domainTables[t.domain]) domainTables[t.domain] = []
    domainTables[t.domain].push(name)
  }

  // 각 domain 내부 배치 (Greedy Column Packing)
  const domainSizes = {}
  for (const d of domains) {
    const names = domainTables[d] || []
    if (!names.length) continue

    const COLS = names.length <= 2 ? names.length : names.length <= 5 ? 2 : 3
    const sorted = [...names].sort((a, b) => (tbls[b].cols.length) - (tbls[a].cols.length))
    const colH = new Array(COLS).fill(0)

    for (const name of sorted) {
      let mc = 0
      for (let i = 1; i < COLS; i++) if (colH[i] < colH[mc]) mc = i
      tbls[name]._rx = PAD + mc * (NODE_W + GAP)
      tbls[name]._ry = PAD_TOP + colH[mc]
      colH[mc] += tblH(tbls[name].cols) + GAP
    }

    domainSizes[d] = {
      w:     PAD * 2 + COLS * NODE_W + (COLS - 1) * GAP,
      h:     PAD_TOP + Math.max(...colH) + PAD,
      color: domainColor[d],
    }
  }

  // domain groups → 2열 그리드
  const groupPos = {}
  let c0y = 0, c1y = 0, c0maxW = 0
  const vDomains = domains.filter(d => domainSizes[d])

  vDomains.forEach((d, i) => {
    if (i % 2 === 0) c0maxW = Math.max(c0maxW, domainSizes[d].w)
  })

  vDomains.forEach((d, i) => {
    const col = i % 2
    const cx  = col === 0 ? 0 : c0maxW + GROUP_GAP
    if (col === 0) {
      groupPos[d] = { x: cx, y: c0y, ...domainSizes[d] }
      c0y += domainSizes[d].h + GROUP_GAP
    } else {
      groupPos[d] = { x: cx, y: c1y, ...domainSizes[d] }
      c1y += domainSizes[d].h + GROUP_GAP
    }
  })

  // 상대 → 절대 좌표
  for (const [name, t] of Object.entries(tbls)) {
    const g = groupPos[t.domain]
    t._absX = g ? g.x + (t._rx || 0) : 50
    t._absY = g ? g.y + (t._ry || 0) : 50
    t._w    = NODE_W
    t._h    = tblH(t.cols)
  }

  const totalW = Math.max(...vDomains.map(d => groupPos[d].x + groupPos[d].w), 800) + 60
  const totalH = Math.max(...vDomains.map(d => groupPos[d].y + groupPos[d].h), 600) + 60

  return { tbls, groupPos, domainColor, totalW, totalH }
}

// ── 직각 경로 계산 ───────────────────────────────────────────────────────────
function computePath(a, b) {
  const acx = a._absX + a._w / 2, acy = a._absY + a._h / 2
  const bcx = b._absX + b._w / 2, bcy = b._absY + b._h / 2
  const dx = bcx - acx, dy = bcy - acy

  let x1, y1, x2, y2, aDir, bDir

  if (Math.abs(dx) * 0.6 > Math.abs(dy)) {
    y1 = acy; y2 = bcy
    if (dx > 0) { x1 = a._absX + a._w; x2 = b._absX;         aDir = 'right'; bDir = 'left'  }
    else        { x1 = a._absX;         x2 = b._absX + b._w;  aDir = 'left';  bDir = 'right' }
    const mx = (x1 + x2) / 2
    return { d: `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`, x1, y1, x2, y2, aDir, bDir }
  } else {
    x1 = acx; x2 = bcx
    if (dy > 0) { y1 = a._absY + a._h; y2 = b._absY;          aDir = 'down'; bDir = 'up'   }
    else        { y1 = a._absY;         y2 = b._absY + b._h;   aDir = 'up';   bDir = 'down' }
    const my = (y1 + y2) / 2
    return { d: `M${x1},${y1} L${x1},${my} L${x2},${my} L${x2},${y2}`, x1, y1, x2, y2, aDir, bDir }
  }
}

// ── Crow's Foot ──────────────────────────────────────────────────────────────
// Many 쪽 (FK 테이블) - 3갈래 발
function CrowsMany({ x, y, dir }) {
  const S = CF_S, sw = '1.2', col = '#9ca3af'
  if (dir === 'right') return <>
    <line x1={x+S} y1={y} x2={x} y2={y-S} stroke={col} strokeWidth={sw} />
    <line x1={x+S} y1={y} x2={x} y2={y}   stroke={col} strokeWidth={sw} />
    <line x1={x+S} y1={y} x2={x} y2={y+S} stroke={col} strokeWidth={sw} />
  </>
  if (dir === 'left') return <>
    <line x1={x-S} y1={y} x2={x} y2={y-S} stroke={col} strokeWidth={sw} />
    <line x1={x-S} y1={y} x2={x} y2={y}   stroke={col} strokeWidth={sw} />
    <line x1={x-S} y1={y} x2={x} y2={y+S} stroke={col} strokeWidth={sw} />
  </>
  if (dir === 'down') return <>
    <line x1={x} y1={y+S} x2={x-S} y2={y} stroke={col} strokeWidth={sw} />
    <line x1={x} y1={y+S} x2={x}   y2={y} stroke={col} strokeWidth={sw} />
    <line x1={x} y1={y+S} x2={x+S} y2={y} stroke={col} strokeWidth={sw} />
  </>
  if (dir === 'up') return <>
    <line x1={x} y1={y-S} x2={x-S} y2={y} stroke={col} strokeWidth={sw} />
    <line x1={x} y1={y-S} x2={x}   y2={y} stroke={col} strokeWidth={sw} />
    <line x1={x} y1={y-S} x2={x+S} y2={y} stroke={col} strokeWidth={sw} />
  </>
  return null
}

// One 쪽 (PK 테이블) - 수직선 1개
function CrowsOne({ x, y, dir }) {
  const S = CF_S, col = '#9ca3af'
  if (dir === 'left' || dir === 'right')
    return <line x1={x} y1={y-S} x2={x} y2={y+S} stroke={col} strokeWidth="1.5" />
  return <line x1={x-S} y1={y} x2={x+S} y2={y} stroke={col} strokeWidth="1.5" />
}

// ── Table Card ───────────────────────────────────────────────────────────────
function TableCard({ name, tbl, color, isActive, isDimmed, onHover, onLeave }) {
  return (
    <div
      onMouseEnter={() => onHover(name)}
      onMouseLeave={onLeave}
      style={{
        position:     'absolute',
        left:         tbl._absX,
        top:          tbl._absY,
        width:        NODE_W,
        background:   '#ffffff',
        border:       `1px solid ${isActive ? color.main : '#e5e5e5'}`,
        borderRadius: 5,
        boxShadow:    isActive
          ? `0 0 0 2px ${color.main}33, 0 2px 8px rgba(0,0,0,0.1)`
          : '0 1px 3px rgba(0,0,0,0.07)',
        opacity:      isDimmed ? 0.2 : 1,
        transition:   'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
        cursor:       'default',
        overflow:     'hidden',
        zIndex:       2,
      }}
    >
      {/* 헤더 */}
      <div style={{ background: color.main, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 7, height: 7, borderRadius: 2, background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11, fontWeight: 600, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </span>
      </div>

      {/* 물리명 */}
      <div style={{
        padding: '3px 10px', fontSize: 10, color: '#999',
        fontFamily: 'IBM Plex Mono, monospace',
        borderBottom: '1px solid #f0f0f0', background: '#fafafa',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {tbl.physical}
      </div>

      {/* 컬럼 목록 */}
      {tbl.cols.map((col, i) => (
        <div key={i} style={{
          display:    'flex',
          alignItems: 'center',
          padding:    '0 8px',
          height:     COL_H,
          borderBottom: i < tbl.cols.length - 1 ? '1px solid #f5f5f5' : 'none',
          background: i % 2 === 0 ? '#fff' : '#fafafa',
          gap:        4,
        }}>
          {col.pk
            ? <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', fontFamily: 'IBM Plex Mono, monospace', width: 18, flexShrink: 0 }}>PK</span>
            : col.fk
              ? <span style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', fontFamily: 'IBM Plex Mono, monospace', width: 18, flexShrink: 0 }}>FK</span>
              : <span style={{ width: 18, flexShrink: 0 }} />
          }
          <span style={{ flex: 1, fontSize: 11, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'IBM Plex Mono, monospace' }}>
            {col.n}
          </span>
          <span style={{ fontSize: 10, color: '#bbb', fontFamily: 'IBM Plex Mono, monospace', flexShrink: 0, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {col.t}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ERDDiagram({ erdData }) {
  const containerRef = useRef(null)
  const [scale, setScale]     = useState(0.8)
  const [panX,  setPanX]      = useState(30)
  const [panY,  setPanY]      = useState(30)
  const [hover, setHover]     = useState(null)
  const isPanning = useRef(false)
  const lastPos   = useRef({ x: 0, y: 0 })

  // 레이아웃 계산 (memo)
  const layout = useMemo(() => {
    if (!erdData?.tables || Object.keys(erdData.tables).length === 0) return null
    return computeLayout(erdData.tables, erdData.domains || [])
  }, [erdData])

  const rels = erdData?.rels || []

  // 호버 시 연관 테이블 set
  const activeSet = useMemo(() => {
    if (!hover || !layout) return null
    const s = new Set([hover])
    rels.forEach(r => {
      if (r.f === hover) s.add(r.t)
      if (r.t === hover) s.add(r.f)
    })
    return s
  }, [hover, rels, layout])

  // 전체 보기
  const fitAll = useCallback(() => {
    if (!layout || !containerRef.current) return
    const cW = containerRef.current.clientWidth
    const cH = containerRef.current.clientHeight
    const margin = 80
    const s = Math.min(
      (cW - margin) / layout.totalW,
      (cH - margin) / layout.totalH,
      1
    )
    setScale(s)
    setPanX((cW - layout.totalW * s) / 2)
    setPanY((cH - layout.totalH * s) / 2)
  }, [layout])

  useEffect(() => { if (layout) setTimeout(fitAll, 0) }, [layout])

  // 마우스 휠 줌
  const onWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setScale(prev => {
      const ns = Math.max(0.1, Math.min(2, prev + delta))
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return ns
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      setPanX(px => mx - (mx - px) * (ns / prev))
      setPanY(py => my - (my - py) * (ns / prev))
      return ns
    })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // 드래그 Pan
  const onMouseDown = (e) => {
    if (e.button !== 0) return
    isPanning.current = true
    lastPos.current   = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e) => {
    if (!isPanning.current) return
    setPanX(p => p + e.clientX - lastPos.current.x)
    setPanY(p => p + e.clientY - lastPos.current.y)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseUp = () => { isPanning.current = false }

  if (!layout) {
    return (
      <div style={{ padding: 40, color: '#888', fontSize: 13 }}>
        ERD 데이터가 없습니다. XML 파일을 업로드하세요.
      </div>
    )
  }

  const { tbls, groupPos, domainColor } = layout

  // 관계선 경로 계산
  const relPaths = rels.map((r, i) => {
    const a = tbls[r.f], b = tbls[r.t]
    if (!a || !b) return null
    return { ...r, i, ...computePath(a, b) }
  }).filter(Boolean)

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: '#f8f8f8', overflow: 'hidden',
        userSelect: 'none', cursor: isPanning.current ? 'grabbing' : 'grab',
      }}
    >
      {/* 툴바 */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 100, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={fitAll}
          style={{ padding: '4px 12px', fontSize: 11, background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer', color: '#333' }}
        >
          전체 보기
        </button>
        <div style={{ padding: '4px 10px', fontSize: 11, background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, color: '#888', fontFamily: 'IBM Plex Mono, monospace' }}>
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* 캔버스 */}
      <div style={{
        position:        'absolute',
        transformOrigin: '0 0',
        transform:       `translate(${panX}px, ${panY}px) scale(${scale})`,
        willChange:      'transform',
        width:           layout.totalW,
        height:          layout.totalH,
      }}>
        {/* 도메인 그룹 박스 */}
        {Object.entries(groupPos).map(([d, g]) => (
          <div key={d} style={{
            position:    'absolute',
            left: g.x, top: g.y, width: g.w, height: g.h,
            background:  g.color.bg,
            border:      `1px solid ${g.color.bd}`,
            borderRadius: 8, zIndex: 0,
          }}>
            <span style={{
              position:   'absolute', top: 11, left: 14,
              fontSize:   11, fontWeight: 600,
              color:      g.color.main, letterSpacing: '0.03em',
            }}>
              {d}
            </span>
          </div>
        ))}

        {/* SVG 관계선 */}
        <svg style={{
          position: 'absolute', top: 0, left: 0,
          width: layout.totalW, height: layout.totalH,
          pointerEvents: 'none', zIndex: 1, overflow: 'visible',
        }}>
          {relPaths.map(r => {
            const isHighlighted = activeSet
              ? (activeSet.has(r.f) && activeSet.has(r.t))
              : true
            const isInternal = tbls[r.f]?.domain === tbls[r.t]?.domain
            return (
              <g key={r.i} opacity={isHighlighted ? 1 : 0.12}>
                <path
                  d={r.d}
                  fill="none"
                  stroke={isInternal ? '#9ca3af' : '#d1d5db'}
                  strokeWidth={isInternal ? 1.3 : 1}
                  strokeDasharray={isInternal ? undefined : '6,4'}
                />
                {/* FK(many) 쪽 */}
                <CrowsMany x={r.x1} y={r.y1} dir={r.aDir} />
                {/* PK(one) 쪽 */}
                <CrowsOne  x={r.x2} y={r.y2} dir={r.bDir} />
              </g>
            )
          })}
        </svg>

        {/* 테이블 카드 */}
        {Object.entries(tbls).map(([name, tbl]) => {
          const color    = domainColor[tbl.domain] || DOMAIN_PALETTE[0]
          const isActive = activeSet ? activeSet.has(name) : false
          const isDimmed = activeSet ? !activeSet.has(name) : false
          return (
            <TableCard
              key={name}
              name={name}
              tbl={tbl}
              color={color}
              isActive={isActive}
              isDimmed={isDimmed}
              onHover={setHover}
              onLeave={() => setHover(null)}
            />
          )
        })}
      </div>

      {/* 범례 */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, zIndex: 100,
        background: '#fff', border: '1px solid #e5e5e5',
        borderRadius: 6, padding: '6px 14px',
        display: 'flex', gap: 16, fontSize: 11, color: '#666',
        alignItems: 'center',
      }}>
        <span>
          <span style={{ color: '#d97706', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>PK</span>
          {' '}Primary Key
        </span>
        <span>
          <span style={{ color: '#7c3aed', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>FK</span>
          {' '}Foreign Key
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="24" height="10">
            <line x1="0" y1="5" x2="24" y2="5" stroke="#9ca3af" strokeWidth="1.3" />
          </svg>
          도메인 내부
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="24" height="10">
            <line x1="0" y1="5" x2="24" y2="5" stroke="#d1d5db" strokeWidth="1" strokeDasharray="5,3" />
          </svg>
          도메인 간
        </span>
        <span style={{ fontSize: 10, color: '#bbb' }}>스크롤: 줌 | 드래그: 이동 | 호버: 연관 하이라이트</span>
      </div>
    </div>
  )
}
