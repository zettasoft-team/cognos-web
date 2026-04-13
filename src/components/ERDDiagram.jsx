/**
 * ERD Diagram — 2-level layout
 * View (namespace) ▶ Domain (folder) ▶ Table Card
 */
import { useRef, useState, useEffect, useMemo, useCallback } from 'react'

// ── 상수 ────────────────────────────────────────────────────────────────────
const NODE_W   = 200
const COL_H    = 18
const HEADER_H = 32
const CF_S     = 8

const T_PAD  = 14   // domain box 내부 수평 패딩
const T_TOP  = 28   // domain box 내부 상단 (도메인 라벨 영역)
const T_GAP  = 16   // domain 내 테이블 열 간격
const D_GAP  = 20   // view 내 domain box 간 간격
const V_PAD  = 16   // view box 내부 수평 패딩
const V_TOP  = 38   // view box 내부 상단 (뷰 라벨 영역)
const V_GAP  = 40   // view box 간 간격

// ── 색상 팔레트 ──────────────────────────────────────────────────────────────
const VIEW_PALETTE = [
  { bg: 'rgba(59,130,246,0.04)',  bd: '#bfdbfe', label: '#1d4ed8', main: '#3b82f6' },
  { bg: 'rgba(245,158,11,0.04)', bd: '#fde68a', label: '#b45309', main: '#f59e0b' },
  { bg: 'rgba(139,92,246,0.04)', bd: '#ddd6fe', label: '#6d28d9', main: '#8b5cf6' },
  { bg: 'rgba(16,185,129,0.04)', bd: '#a7f3d0', label: '#047857', main: '#10b981' },
  { bg: 'rgba(239,68,68,0.04)',  bd: '#fecaca', label: '#b91c1c', main: '#ef4444' },
  { bg: 'rgba(6,182,212,0.04)',  bd: '#a5f3fc', label: '#0e7490', main: '#06b6d4' },
]

const DOMAIN_PALETTE = [
  { main: '#64748b', bg: 'rgba(100,116,139,0.06)', bd: '#cbd5e1' },
  { main: '#6b7280', bg: 'rgba(107,114,128,0.06)', bd: '#d1d5db' },
  { main: '#737373', bg: 'rgba(115,115,115,0.06)', bd: '#d4d4d4' },
  { main: '#78716c', bg: 'rgba(120,113,108,0.06)', bd: '#d6d3d1' },
  { main: '#71717a', bg: 'rgba(113,113,122,0.06)', bd: '#d4d4d8' },
]

// ── 유틸 ────────────────────────────────────────────────────────────────────
function tblH(cols) { return HEADER_H + 16 + (cols?.length || 0) * COL_H }

// ── 레이아웃 계산 ────────────────────────────────────────────────────────────
function computeLayout(tables, views, domainsByView) {
  const tbls = {}
  for (const [k, v] of Object.entries(tables)) {
    tbls[k] = { ...v, cols: [...(v.cols || [])] }
  }

  const viewColors   = {}   // viewName → palette
  const domainColors = {}   // "view/domain" → palette
  const domainSizes  = {}   // "view/domain" → {w, h}
  const domainRelPos = {}   // "view/domain" → {x, y} (view 내 상대 좌표)
  const domainAbsPos = {}   // "view/domain" → {x, y, w, h} (절대)
  const viewPos      = {}   // viewName → {x, y, w, h}

  // ── Step 1: domain 내부 레이아웃 ──────────────────────────────────────────
  views.forEach((viewName, vi) => {
    viewColors[viewName] = VIEW_PALETTE[vi % VIEW_PALETTE.length]
    const viewDomains = domainsByView[viewName] || []

    viewDomains.forEach((domName, di) => {
      const dk = `${viewName}/${domName}`
      domainColors[dk] = DOMAIN_PALETTE[di % DOMAIN_PALETTE.length]

      const tblKeys = Object.keys(tbls).filter(k =>
        tbls[k].view === viewName && tbls[k].domain === domName
      )
      if (tblKeys.length === 0) return

      const TCOLS = tblKeys.length <= 1 ? 1 : tblKeys.length <= 4 ? 2 : 3
      const sorted = [...tblKeys].sort((a, b) =>
        (tbls[b].cols?.length || 0) - (tbls[a].cols?.length || 0)
      )
      const colH = new Array(TCOLS).fill(0)
      for (const key of sorted) {
        let mc = 0
        for (let i = 1; i < TCOLS; i++) if (colH[i] < colH[mc]) mc = i
        tbls[key]._rx = T_PAD + mc * (NODE_W + T_GAP)
        tbls[key]._ry = T_TOP + colH[mc]
        colH[mc] += tblH(tbls[key].cols) + T_GAP
      }
      domainSizes[dk] = {
        w: T_PAD * 2 + TCOLS * NODE_W + (TCOLS - 1) * T_GAP,
        h: T_TOP + Math.max(...colH) + T_PAD,
      }
    })
  })

  // ── Step 2: view 내부 레이아웃 (domain grid) ──────────────────────────────
  const viewSizes = {}
  for (const viewName of views) {
    const activeDoms = (domainsByView[viewName] || []).filter(d => domainSizes[`${viewName}/${d}`])
    const D_COLS = activeDoms.length <= 1 ? 1 : 2
    let c0y = V_TOP + V_PAD, c1y = V_TOP + V_PAD
    let c0maxW = 0, c1maxW = 0

    activeDoms.forEach((d, i) => {
      if (i % D_COLS === 0) c0maxW = Math.max(c0maxW, domainSizes[`${viewName}/${d}`].w)
    })

    activeDoms.forEach((d, i) => {
      const ds  = domainSizes[`${viewName}/${d}`]
      const col = i % D_COLS
      const cx  = col === 0 ? V_PAD : V_PAD + c0maxW + D_GAP
      const dk  = `${viewName}/${d}`
      if (col === 0) {
        domainRelPos[dk] = { x: cx, y: c0y }
        c0y += ds.h + D_GAP
      } else {
        domainRelPos[dk] = { x: cx, y: c1y }
        c1y += ds.h + D_GAP
        c1maxW = Math.max(c1maxW, ds.w)
      }
    })

    const contentW = V_PAD * 2 + c0maxW + (D_COLS > 1 ? D_GAP + c1maxW : 0)
    const contentH = Math.max(c0y, c1y) + V_PAD
    viewSizes[viewName] = { w: Math.max(contentW, 280), h: Math.max(contentH, 120) }
  }

  // ── Step 3: view 2열 그리드 ───────────────────────────────────────────────
  const V_COLS = 2
  let vc0y = 0, vc1y = 0, vc0maxW = 0
  const activeViews = views.filter(v => viewSizes[v])

  activeViews.forEach((v, i) => {
    if (i % V_COLS === 0) vc0maxW = Math.max(vc0maxW, viewSizes[v].w)
  })
  activeViews.forEach((v, i) => {
    const vs  = viewSizes[v]
    const col = i % V_COLS
    const cx  = col === 0 ? 0 : vc0maxW + V_GAP
    if (col === 0) {
      viewPos[v] = { x: cx, y: vc0y, w: vs.w, h: vs.h }
      vc0y += vs.h + V_GAP
    } else {
      viewPos[v] = { x: cx, y: vc1y, w: vs.w, h: vs.h }
      vc1y += vs.h + V_GAP
    }
  })

  // ── Step 4: domain 절대 좌표 ──────────────────────────────────────────────
  for (const [dk, rel] of Object.entries(domainRelPos)) {
    const vn = dk.split('/')[0]
    const vp = viewPos[vn]
    if (vp) domainAbsPos[dk] = { x: vp.x + rel.x, y: vp.y + rel.y, ...domainSizes[dk] }
  }

  // ── Step 5: table 절대 좌표 ───────────────────────────────────────────────
  for (const [key, tbl] of Object.entries(tbls)) {
    const vp = viewPos[tbl.view]
    const dr = domainRelPos[`${tbl.view}/${tbl.domain}`]
    if (vp && dr) {
      tbl._absX = vp.x + dr.x + (tbl._rx || 0)
      tbl._absY = vp.y + dr.y + (tbl._ry || 0)
    } else if (vp) {
      tbl._absX = vp.x + V_PAD
      tbl._absY = vp.y + V_TOP
    } else {
      tbl._absX = 50; tbl._absY = 50
    }
    tbl._w = NODE_W
    tbl._h = tblH(tbl.cols)
  }

  const vps    = Object.values(viewPos)
  const totalW = vps.length ? Math.max(...vps.map(v => v.x + v.w)) + 60 : 800
  const totalH = vps.length ? Math.max(...vps.map(v => v.y + v.h)) + 60 : 600

  return { tbls, viewPos, viewColors, domainAbsPos, domainColors, totalW, totalH }
}

// ── 직각 경로 ────────────────────────────────────────────────────────────────
function computePath(a, b) {
  const acx = a._absX + a._w / 2, acy = a._absY + a._h / 2
  const bcx = b._absX + b._w / 2, bcy = b._absY + b._h / 2
  const dx = bcx - acx, dy = bcy - acy
  let x1, y1, x2, y2, aDir, bDir

  if (Math.abs(dx) * 0.6 > Math.abs(dy)) {
    y1 = acy; y2 = bcy
    if (dx > 0) { x1 = a._absX + a._w; x2 = b._absX;        aDir = 'right'; bDir = 'left' }
    else        { x1 = a._absX;         x2 = b._absX + b._w; aDir = 'left';  bDir = 'right' }
    const mx = (x1 + x2) / 2
    return { d: `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`, x1, y1, x2, y2, aDir, bDir }
  } else {
    x1 = acx; x2 = bcx
    if (dy > 0) { y1 = a._absY + a._h; y2 = b._absY;         aDir = 'down'; bDir = 'up' }
    else        { y1 = a._absY;         y2 = b._absY + b._h;  aDir = 'up';   bDir = 'down' }
    const my = (y1 + y2) / 2
    return { d: `M${x1},${y1} L${x1},${my} L${x2},${my} L${x2},${y2}`, x1, y1, x2, y2, aDir, bDir }
  }
}

// ── Crow's Foot ──────────────────────────────────────────────────────────────
function CrowsMany({ x, y, dir }) {
  const S = CF_S, sw = '1.2', col = '#9ca3af'
  if (dir === 'right') return <><line x1={x+S} y1={y} x2={x} y2={y-S} stroke={col} strokeWidth={sw}/><line x1={x+S} y1={y} x2={x} y2={y} stroke={col} strokeWidth={sw}/><line x1={x+S} y1={y} x2={x} y2={y+S} stroke={col} strokeWidth={sw}/></>
  if (dir === 'left')  return <><line x1={x-S} y1={y} x2={x} y2={y-S} stroke={col} strokeWidth={sw}/><line x1={x-S} y1={y} x2={x} y2={y} stroke={col} strokeWidth={sw}/><line x1={x-S} y1={y} x2={x} y2={y+S} stroke={col} strokeWidth={sw}/></>
  if (dir === 'down')  return <><line x1={x} y1={y+S} x2={x-S} y2={y} stroke={col} strokeWidth={sw}/><line x1={x} y1={y+S} x2={x} y2={y} stroke={col} strokeWidth={sw}/><line x1={x} y1={y+S} x2={x+S} y2={y} stroke={col} strokeWidth={sw}/></>
  if (dir === 'up')    return <><line x1={x} y1={y-S} x2={x-S} y2={y} stroke={col} strokeWidth={sw}/><line x1={x} y1={y-S} x2={x} y2={y} stroke={col} strokeWidth={sw}/><line x1={x} y1={y-S} x2={x+S} y2={y} stroke={col} strokeWidth={sw}/></>
  return null
}
function CrowsOne({ x, y, dir }) {
  const S = CF_S, col = '#9ca3af'
  if (dir === 'left' || dir === 'right')
    return <line x1={x} y1={y-S} x2={x} y2={y+S} stroke={col} strokeWidth="1.5"/>
  return <line x1={x-S} y1={y} x2={x+S} y2={y} stroke={col} strokeWidth="1.5"/>
}

// ── Table Card ───────────────────────────────────────────────────────────────
function TableCard({ name, tbl, viewColor, isActive, isDimmed, onHover, onLeave }) {
  const hdrColor = isActive ? viewColor.main : viewColor.main + 'cc'
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
        border:       `1px solid ${isActive ? viewColor.main : '#e5e5e5'}`,
        borderRadius: 5,
        boxShadow:    isActive
          ? `0 0 0 2px ${viewColor.main}33, 0 2px 8px rgba(0,0,0,0.1)`
          : '0 1px 3px rgba(0,0,0,0.07)',
        opacity:      isDimmed ? 0.2 : 1,
        transition:   'opacity 0.15s, border-color 0.15s, box-shadow 0.15s',
        overflow:     'hidden',
        zIndex:       3,
      }}
    >
      {/* 헤더 */}
      <div style={{ background: hdrColor, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: 2, background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name.split('::').pop()}
        </span>
        {tbl.nodeType === 'hierarchy' && (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.2)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, fontFamily: 'IBM Plex Mono, monospace' }}>H</span>
        )}
        {tbl.nodeType === 'fact' && (
          <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.2)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, fontFamily: 'IBM Plex Mono, monospace' }}>F</span>
        )}
      </div>

      {/* 물리명 */}
      <div style={{ padding: '3px 10px', fontSize: 10, color: '#999', fontFamily: 'IBM Plex Mono, monospace', borderBottom: '1px solid #f0f0f0', background: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tbl.physical}
      </div>

      {/* 컬럼 목록 */}
      {(tbl.cols || []).map((col, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 8px', height: COL_H, borderBottom: i < tbl.cols.length - 1 ? '1px solid #f5f5f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa', gap: 4 }}>
          {col.pk
            ? <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', fontFamily: 'IBM Plex Mono, monospace', width: 18, flexShrink: 0 }}>PK</span>
            : col.agg
              ? <span style={{ fontSize: 9, fontWeight: 700, color: '#059669', fontFamily: 'IBM Plex Mono, monospace', width: 18, flexShrink: 0 }} title={col.agg}>{col.agg.slice(0, 2).toUpperCase()}</span>
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
  const [scale, setScale] = useState(0.7)
  const [panX,  setPanX]  = useState(30)
  const [panY,  setPanY]  = useState(30)
  const [hover, setHover] = useState(null)
  const isPanning = useRef(false)
  const lastPos   = useRef({ x: 0, y: 0 })

  const layout = useMemo(() => {
    if (!erdData?.tables || !erdData?.views?.length) return null
    return computeLayout(erdData.tables, erdData.views, erdData.domains_by_view || {})
  }, [erdData])

  const rels = erdData?.rels || []

  const activeSet = useMemo(() => {
    if (!hover || !layout) return null
    const s = new Set([hover])
    rels.forEach(r => {
      if (r.f === hover) s.add(r.t)
      if (r.t === hover) s.add(r.f)
    })
    return s
  }, [hover, rels, layout])

  const fitAll = useCallback(() => {
    if (!layout || !containerRef.current) return
    const cW = containerRef.current.clientWidth
    const cH = containerRef.current.clientHeight
    const margin = 80
    const s = Math.min((cW - margin) / layout.totalW, (cH - margin) / layout.totalH, 1)
    setScale(s)
    setPanX((cW - layout.totalW * s) / 2)
    setPanY((cH - layout.totalH * s) / 2)
  }, [layout])

  useEffect(() => { if (layout) setTimeout(fitAll, 0) }, [layout])

  const onWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    setScale(prev => {
      const ns   = Math.max(0.1, Math.min(2, prev + delta))
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

  const onMouseDown = e => { if (e.button !== 0) return; isPanning.current = true; lastPos.current = { x: e.clientX, y: e.clientY } }
  const onMouseMove = e => { if (!isPanning.current) return; setPanX(p => p + e.clientX - lastPos.current.x); setPanY(p => p + e.clientY - lastPos.current.y); lastPos.current = { x: e.clientX, y: e.clientY } }
  const onMouseUp   = () => { isPanning.current = false }

  if (!layout) {
    return <div style={{ padding: 40, color: '#888', fontSize: 13 }}>ERD 데이터가 없습니다. XML 파일을 업로드하세요.</div>
  }

  const { tbls, viewPos, viewColors, domainAbsPos, domainColors } = layout

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
      style={{ position: 'relative', width: '100%', height: '100%', background: '#f4f4f4', overflow: 'hidden', userSelect: 'none', cursor: 'grab' }}
    >
      {/* 툴바 */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 100, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={fitAll} style={{ padding: '4px 12px', fontSize: 11, background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer', color: '#333' }}>
          전체 보기
        </button>
        <div style={{ padding: '4px 10px', fontSize: 11, background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, color: '#888', fontFamily: 'IBM Plex Mono, monospace' }}>
          {Math.round(scale * 100)}%
        </div>
      </div>

      {/* 캔버스 */}
      <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${panX}px,${panY}px) scale(${scale})`, willChange: 'transform', width: layout.totalW, height: layout.totalH }}>

        {/* ── 뷰 박스 (z-index:0) ── */}
        {Object.entries(viewPos).map(([viewName, vp]) => {
          const vc = viewColors[viewName] || VIEW_PALETTE[0]
          return (
            <div key={viewName} style={{ position: 'absolute', left: vp.x, top: vp.y, width: vp.w, height: vp.h, background: vc.bg, border: `1.5px solid ${vc.bd}`, borderRadius: 10, zIndex: 0 }}>
              <span style={{ position: 'absolute', top: 12, left: 14, fontSize: 12, fontWeight: 700, color: vc.label, letterSpacing: '0.04em', fontFamily: 'IBM Plex Mono, monospace' }}>
                {viewName}
              </span>
            </div>
          )
        })}

        {/* ── 도메인 박스 (z-index:1) ── */}
        {Object.entries(domainAbsPos).map(([dk, dp]) => {
          const dc    = domainColors[dk] || DOMAIN_PALETTE[0]
          const label = dk.split('/').slice(1).join('/')   // domain 부분만
          return (
            <div key={dk} style={{ position: 'absolute', left: dp.x, top: dp.y, width: dp.w, height: dp.h, background: dc.bg, border: `1px solid ${dc.bd}`, borderRadius: 6, zIndex: 1 }}>
              {label && (
                <span style={{ position: 'absolute', top: 9, left: 12, fontSize: 10, fontWeight: 600, color: dc.main, letterSpacing: '0.03em' }}>
                  {label}
                </span>
              )}
            </div>
          )
        })}

        {/* ── SVG 관계선 (z-index:2) ── */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: layout.totalW, height: layout.totalH, pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}>
          {relPaths.map(r => {
            const isHighlighted = activeSet ? (activeSet.has(r.f) && activeSet.has(r.t)) : true
            const isDimRef      = r.type === 'dim_ref'
            const sameView      = tbls[r.f]?.view === tbls[r.t]?.view
            return (
              <g key={r.i} opacity={isHighlighted ? 1 : 0.1}>
                <path d={r.d} fill="none"
                  stroke={sameView ? '#9ca3af' : '#d1d5db'}
                  strokeWidth={sameView ? 1.3 : 1}
                  strokeDasharray={isDimRef ? '6,4' : (sameView ? undefined : '6,4')}
                />
                <CrowsMany x={r.x1} y={r.y1} dir={r.aDir} />
                <CrowsOne  x={r.x2} y={r.y2} dir={r.bDir} />
              </g>
            )
          })}
        </svg>

        {/* ── 테이블 카드 (z-index:3) ── */}
        {Object.entries(tbls).map(([name, tbl]) => {
          const vc       = viewColors[tbl.view] || VIEW_PALETTE[0]
          const isActive = activeSet ? activeSet.has(name) : false
          const isDimmed = activeSet ? !activeSet.has(name) : false
          return (
            <TableCard key={name} name={name} tbl={tbl} viewColor={vc} isActive={isActive} isDimmed={isDimmed} onHover={setHover} onLeave={() => setHover(null)} />
          )
        })}
      </div>

      {/* 범례 */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 100, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 6, padding: '6px 14px', display: 'flex', gap: 16, fontSize: 11, color: '#666', alignItems: 'center' }}>
        <span><span style={{ color: '#d97706', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>PK</span> Primary Key</span>
        <span><span style={{ color: '#059669', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>집계</span> Measure</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#9ca3af" strokeWidth="1.3"/></svg>
          뷰 내부
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#d1d5db" strokeWidth="1" strokeDasharray="5,3"/></svg>
          뷰 간 / 차원 참조
        </span>
        <span style={{ fontSize: 10, color: '#bbb' }}>스크롤: 줌 | 드래그: 이동 | 호버: 연관 하이라이트</span>
      </div>
    </div>
  )
}
