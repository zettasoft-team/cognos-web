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

const T_PAD = 14
const T_TOP = 28
const T_GAP = 16
const D_GAP = 20
const V_PAD = 16
const V_TOP = 38
const V_GAP = 40

// ── 색상 ────────────────────────────────────────────────────────────────────
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
  for (const [k, v] of Object.entries(tables))
    tbls[k] = { ...v, cols: [...(v.cols || [])] }

  const viewColors   = {}
  const domainColors = {}
  const domainSizes  = {}
  const domainRelPos = {}
  const domainAbsPos = {}
  const viewPos      = {}

  // Step 1: domain 내부 레이아웃
  views.forEach((viewName, vi) => {
    viewColors[viewName] = VIEW_PALETTE[vi % VIEW_PALETTE.length]
    const doms = domainsByView[viewName] || []

    doms.forEach((domName, di) => {
      const dk      = `${viewName}/${domName}`
      domainColors[dk] = DOMAIN_PALETTE[di % DOMAIN_PALETTE.length]
      const tblKeys = Object.keys(tbls).filter(k =>
        tbls[k].view === viewName && tbls[k].domain === domName
      )
      if (!tblKeys.length) return

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

  // Step 2: view 내부 domain grid — Greedy column packing
  const viewSizes = {}
  for (const viewName of views) {
    const active = (domainsByView[viewName] || []).filter(d => domainSizes[`${viewName}/${d}`])
    if (!active.length) continue

    // 도메인 수에 따라 열 수 결정 (최대 3열)
    const DC = active.length <= 1 ? 1 : active.length <= 6 ? 2 : 3

    // Greedy: 항상 현재 높이가 가장 낮은 열에 배치
    const colY = new Array(DC).fill(V_TOP + V_PAD)
    const colW = new Array(DC).fill(0)
    const colItems = Array.from({ length: DC }, () => [])

    // 높이 내림차순 정렬 후 배치 → 균형 향상
    const sorted = [...active].sort((a, b) => (domainSizes[`${viewName}/${b}`]?.h || 0) - (domainSizes[`${viewName}/${a}`]?.h || 0))
    const assignment = {}   // domainName → col
    sorted.forEach(d => {
      const col = colY.indexOf(Math.min(...colY))
      assignment[d] = col
      colItems[col].push(d)
      colW[col] = Math.max(colW[col], domainSizes[`${viewName}/${d}`].w)
      colY[col] += domainSizes[`${viewName}/${d}`].h + D_GAP
    })

    // 열 x 오프셋 계산
    const colX = [V_PAD]
    for (let i = 1; i < DC; i++) colX.push(colX[i - 1] + colW[i - 1] + D_GAP)

    // 원래 순서대로 y 재계산 (greedy 배치 순서 기준)
    const colCurY = new Array(DC).fill(V_TOP + V_PAD)
    active.forEach(d => {   // 원래 순서 유지
      const col = assignment[d]
      const dk  = `${viewName}/${d}`
      domainRelPos[dk] = { x: colX[col], y: colCurY[col] }
      colCurY[col] += domainSizes[dk].h + D_GAP
    })

    const totalW = V_PAD * 2 + colX[DC - 1] + colW[DC - 1]
    const totalH = Math.max(...colCurY) + V_PAD
    viewSizes[viewName] = { w: Math.max(totalW, 280), h: Math.max(totalH, 120) }
  }

  // Step 3: view 2열 grid — Greedy column packing
  const activeViews = views.filter(v => viewSizes[v])

  // 높이 내림차순 정렬로 greedy 배치 (균형)
  const sortedViews = [...activeViews].sort((a, b) => (viewSizes[b]?.h || 0) - (viewSizes[a]?.h || 0))
  const vColY = [0, 0]
  const vColItems = [[], []]
  sortedViews.forEach(v => {
    const col = vColY[0] <= vColY[1] ? 0 : 1
    vColItems[col].push(v)
    vColY[col] += viewSizes[v].h + V_GAP
  })

  // 각 열의 최대 너비
  const vColW = vColItems.map(col => Math.max(0, ...col.map(v => viewSizes[v].w)))
  const col1X = vColW[0] + V_GAP

  // 원래 순서 유지하며 y 누적
  const vCurY = [0, 0]
  activeViews.forEach(v => {
    const col = vColItems[0].includes(v) ? 0 : 1
    const cx  = col === 0 ? 0 : col1X
    const vs  = viewSizes[v]
    viewPos[v] = { x: cx, y: vCurY[col], w: vs.w, h: vs.h }
    vCurY[col] += vs.h + V_GAP
  })

  // Step 4: domain 절대 좌표
  for (const [dk, rel] of Object.entries(domainRelPos)) {
    const vn = dk.split('/')[0]
    const vp = viewPos[vn]
    if (vp) domainAbsPos[dk] = { x: vp.x + rel.x, y: vp.y + rel.y, ...domainSizes[dk] }
  }

  // Step 5: table 절대 좌표
  for (const [key, tbl] of Object.entries(tbls)) {
    const vp = viewPos[tbl.view]
    const dr = domainRelPos[`${tbl.view}/${tbl.domain}`]
    tbl._absX = vp && dr ? vp.x + dr.x + (tbl._rx || 0) : (vp ? vp.x + V_PAD : 50)
    tbl._absY = vp && dr ? vp.y + dr.y + (tbl._ry || 0) : (vp ? vp.y + V_TOP  : 50)
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
    if (dx > 0) { x1 = a._absX + a._w; x2 = b._absX;        aDir = 'right'; bDir = 'left'  }
    else        { x1 = a._absX;         x2 = b._absX + b._w; aDir = 'left';  bDir = 'right' }
    const mx = (x1 + x2) / 2
    return { d: `M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}`, x1, y1, x2, y2, aDir, bDir }
  } else {
    x1 = acx; x2 = bcx
    if (dy > 0) { y1 = a._absY + a._h; y2 = b._absY;         aDir = 'down'; bDir = 'up'   }
    else        { y1 = a._absY;         y2 = b._absY + b._h;  aDir = 'up';   bDir = 'down' }
    const my = (y1 + y2) / 2
    return { d: `M${x1},${y1} L${x1},${my} L${x2},${my} L${x2},${y2}`, x1, y1, x2, y2, aDir, bDir }
  }
}

// ── Crow's Foot ──────────────────────────────────────────────────────────────
function CrowsMany({ x, y, dir }) {
  const S = CF_S, sw = '1.2', c = '#9ca3af'
  if (dir === 'right') return <><line x1={x+S} y1={y} x2={x} y2={y-S} stroke={c} strokeWidth={sw}/><line x1={x+S} y1={y} x2={x} y2={y} stroke={c} strokeWidth={sw}/><line x1={x+S} y1={y} x2={x} y2={y+S} stroke={c} strokeWidth={sw}/></>
  if (dir === 'left')  return <><line x1={x-S} y1={y} x2={x} y2={y-S} stroke={c} strokeWidth={sw}/><line x1={x-S} y1={y} x2={x} y2={y} stroke={c} strokeWidth={sw}/><line x1={x-S} y1={y} x2={x} y2={y+S} stroke={c} strokeWidth={sw}/></>
  if (dir === 'down')  return <><line x1={x} y1={y+S} x2={x-S} y2={y} stroke={c} strokeWidth={sw}/><line x1={x} y1={y+S} x2={x} y2={y} stroke={c} strokeWidth={sw}/><line x1={x} y1={y+S} x2={x+S} y2={y} stroke={c} strokeWidth={sw}/></>
  if (dir === 'up')    return <><line x1={x} y1={y-S} x2={x-S} y2={y} stroke={c} strokeWidth={sw}/><line x1={x} y1={y-S} x2={x} y2={y} stroke={c} strokeWidth={sw}/><line x1={x} y1={y-S} x2={x+S} y2={y} stroke={c} strokeWidth={sw}/></>
  return null
}
function CrowsOne({ x, y, dir }) {
  const S = CF_S, c = '#9ca3af'
  return (dir === 'left' || dir === 'right')
    ? <line x1={x} y1={y-S} x2={x} y2={y+S} stroke={c} strokeWidth="1.5"/>
    : <line x1={x-S} y1={y} x2={x+S} y2={y} stroke={c} strokeWidth="1.5"/>
}

// ── Table Card ───────────────────────────────────────────────────────────────
function TableCard({ name, tbl, viewColor, isActive, isDimmed, onHover, onLeave }) {
  return (
    <div
      onMouseEnter={() => onHover(name)}
      onMouseLeave={onLeave}
      style={{
        position:   'absolute', left: tbl._absX, top: tbl._absY, width: NODE_W,
        background: '#fff',
        border:     `1px solid ${isActive ? viewColor.main : '#e5e5e5'}`,
        borderRadius: 5,
        boxShadow:  isActive ? `0 0 0 2px ${viewColor.main}33,0 2px 8px rgba(0,0,0,.1)` : '0 1px 3px rgba(0,0,0,.07)',
        opacity:    isDimmed ? 0.2 : 1,
        transition: 'opacity .15s,border-color .15s,box-shadow .15s',
        overflow:   'hidden', zIndex: 3,
      }}
    >
      <div style={{ background: viewColor.main + (isActive ? '' : 'cc'), padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: 2, background: 'rgba(255,255,255,.4)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: 'IBM Plex Mono,monospace', fontSize: 11, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name.split('::').pop()}
        </span>
        {tbl.nodeType === 'hierarchy' && <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.8)', background: 'rgba(0,0,0,.2)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, fontFamily: 'IBM Plex Mono,monospace' }}>H</span>}
        {tbl.nodeType === 'fact'      && <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,.8)', background: 'rgba(0,0,0,.2)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, fontFamily: 'IBM Plex Mono,monospace' }}>F</span>}
      </div>
      <div style={{ padding: '3px 10px', fontSize: 10, color: '#999', fontFamily: 'IBM Plex Mono,monospace', borderBottom: '1px solid #f0f0f0', background: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tbl.physical}
      </div>
      {(tbl.cols || []).map((col, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0 8px', height: COL_H, borderBottom: i < tbl.cols.length - 1 ? '1px solid #f5f5f5' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa', gap: 4 }}>
          {col.pk
            ? <span style={{ fontSize: 9, fontWeight: 700, color: '#d97706', fontFamily: 'IBM Plex Mono,monospace', width: 18, flexShrink: 0 }}>PK</span>
            : col.agg
              ? <span style={{ fontSize: 9, fontWeight: 700, color: '#059669', fontFamily: 'IBM Plex Mono,monospace', width: 18, flexShrink: 0 }} title={col.agg}>{col.agg.slice(0,2).toUpperCase()}</span>
              : <span style={{ width: 18, flexShrink: 0 }} />
          }
          <span style={{ flex: 1, fontSize: 11, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'IBM Plex Mono,monospace' }}>{col.n}</span>
          <span style={{ fontSize: 10, color: '#bbb', fontFamily: 'IBM Plex Mono,monospace', flexShrink: 0, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.t}</span>
        </div>
      ))}
    </div>
  )
}

// ── 스크롤바 ─────────────────────────────────────────────────────────────────
function Scrollbar({ axis, pan, totalPx, containerPx, onDrag }) {
  const track  = containerPx - 16
  const ratio  = Math.min(1, containerPx / totalPx)
  const thumbL = Math.max(30, track * ratio)
  const maxScroll = totalPx - containerPx
  const pos    = maxScroll <= 0 ? 0 : Math.max(0, Math.min(1, -pan / maxScroll))
  const thumbP = pos * (track - thumbL) + 8

  if (ratio >= 1) return null

  const isV   = axis === 'v'
  const style = isV
    ? { position: 'absolute', right: 2, top: 0, bottom: 0, width: 10, zIndex: 110, pointerEvents: 'none' }
    : { position: 'absolute', bottom: 2, left: 0, right: 0, height: 10, zIndex: 110, pointerEvents: 'none' }
  const thumbStyle = isV
    ? { position: 'absolute', right: 2, width: 6, borderRadius: 3, top: thumbP, height: thumbL, background: '#a0a0a0', cursor: 'ns-resize', pointerEvents: 'all' }
    : { position: 'absolute', bottom: 2, height: 6, borderRadius: 3, left: thumbP, width: thumbL, background: '#a0a0a0', cursor: 'ew-resize', pointerEvents: 'all' }

  return (
    <div style={style}>
      <div style={thumbStyle} onMouseDown={onDrag} />
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ERDDiagram({ erdData }) {
  const containerRef    = useRef(null)
  const [scale, setScale] = useState(0.7)
  const [panX,  setPanX]  = useState(30)
  const [panY,  setPanY]  = useState(30)
  const [hover, setHover] = useState(null)
  const [cSize, setCSize]         = useState({ w: 0, h: 0 })
  const [scaleInput, setScaleInput] = useState(false)   // 퍼센트 입력 팝업
  const initialDone = useRef(false)

  // 컨테이너 크기 추적
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(() => {
    if (!erdData?.tables || !erdData?.views?.length) return null
    return computeLayout(erdData.tables, erdData.views, erdData.domains_by_view || {})
  }, [erdData])

  const rels = erdData?.rels || []

  const activeSet = useMemo(() => {
    if (!hover || !layout) return null
    const s = new Set([hover])
    rels.forEach(r => { if (r.f === hover) s.add(r.t); if (r.t === hover) s.add(r.f) })
    return s
  }, [hover, rels, layout])

  // DatabaseView 초기 포커싱 (cSize + layout 둘 다 준비됐을 때 한 번만)
  useEffect(() => {
    if (!layout || !cSize.w || initialDone.current) return
    const vp = layout.viewPos['DatabaseView'] || Object.values(layout.viewPos)[0]
    if (!vp) return
    const margin = 40
    const s = Math.min((cSize.w - margin * 2) / vp.w, (cSize.h - margin * 2) / vp.h, 1.2)
    setScale(s)
    setPanX(margin - vp.x * s)
    setPanY(margin - vp.y * s)
    initialDone.current = true
  }, [layout, cSize.w, cSize.h])

  // 전체 보기
  const fitAll = useCallback(() => {
    if (!layout || !cSize.w) return
    const margin = 60
    const s = Math.min((cSize.w - margin) / layout.totalW, (cSize.h - margin) / layout.totalH, 1)
    setScale(s)
    setPanX((cSize.w - layout.totalW * s) / 2)
    setPanY((cSize.h - layout.totalH * s) / 2)
  }, [layout, cSize])

  // ── 드래그: 네이티브 DOM 리스너 (React 합성 이벤트 우회) ──────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onDown = (e) => {
      if (e.button !== 0) return
      // 스크롤바 썸 위에서 시작한 경우 제외
      if (e.target.dataset.scrollThumb) return
      e.preventDefault()

      let lastX = e.clientX
      let lastY = e.clientY
      el.style.cursor = 'grabbing'

      const onMove = (ev) => {
        setPanX(p => p + ev.clientX - lastX)
        setPanY(p => p + ev.clientY - lastY)
        lastX = ev.clientX
        lastY = ev.clientY
      }
      const onUp = () => {
        el.style.cursor = 'grab'
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup',   onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup',   onUp)
    }

    el.addEventListener('mousedown', onDown)
    return () => el.removeEventListener('mousedown', onDown)
  }, [])   // 마운트 시 한 번만

  // 마우스 휠: 기본 = 패닝, Ctrl = 줌
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+스크롤 → 줌
        const delta = e.deltaY > 0 ? -0.05 : 0.05
        const rect  = el.getBoundingClientRect()
        const mx    = e.clientX - rect.left
        const my    = e.clientY - rect.top
        setScale(prev => {
          const ns = Math.max(0.1, Math.min(3, prev + delta))
          setPanX(px => mx - (mx - px) * (ns / prev))
          setPanY(py => my - (my - py) * (ns / prev))
          return ns
        })
      } else if (e.shiftKey) {
        // Shift+스크롤 → 좌우 패닝
        setPanX(p => p - e.deltaY)
      } else {
        // 기본 스크롤 → 상하 패닝
        setPanY(p => p - e.deltaY)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // 스크롤바 드래그 핸들러
  const makeScrollDrag = (axis) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    const isX      = axis === 'x'
    const startC   = isX ? e.clientX : e.clientY
    const contPx   = isX ? cSize.w : cSize.h
    const totalPx  = isX ? (layout?.totalW || 1) : (layout?.totalH || 1)
    const track    = contPx - 16
    const thumbLen = Math.max(30, track * Math.min(1, contPx / (totalPx * scale)))
    const maxScroll = totalPx * scale - contPx
    const thumbRange = track - thumbLen
    if (maxScroll <= 0 || thumbRange <= 0) return
    const ratio = maxScroll / thumbRange

    const startPan = isX ? panX : panY
    const onMove = (ev) => {
      const delta  = (isX ? ev.clientX : ev.clientY) - startC
      const newPan = Math.max(-maxScroll, Math.min(0, startPan - delta * ratio))
      if (isX) setPanX(newPan)
      else     setPanY(newPan)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
  }

  if (!layout) {
    return <div style={{ padding: 40, color: '#888', fontSize: 13 }}>ERD 데이터가 없습니다. XML 파일을 업로드하세요.</div>
  }

  const { tbls, viewPos, viewColors, domainAbsPos, domainColors } = layout

  const relPaths = rels.map((r, i) => {
    const a = tbls[r.f], b = tbls[r.t]
    if (!a || !b) return null
    return { ...r, i, ...computePath(a, b) }
  }).filter(Boolean)

  const totalWpx = layout.totalW * scale
  const totalHpx = layout.totalH * scale

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#f4f4f4', overflow: 'hidden', userSelect: 'none', cursor: 'grab' }}
    >
      {/* 툴바 */}
      <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 200, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={fitAll} style={{ padding: '4px 12px', fontSize: 11, background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, cursor: 'pointer', color: '#333' }}>
          전체 보기
        </button>
        {scaleInput ? (
          <input
            autoFocus
            type="number" min="10" max="300" defaultValue={Math.round(scale * 100)}
            onBlur={e => { const v = parseInt(e.target.value); if (v >= 10 && v <= 300) setScale(v / 100); setScaleInput(false) }}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setScaleInput(false) }}
            style={{ width: 64, padding: '4px 8px', fontSize: 11, border: '1px solid #3b82f6', borderRadius: 4, fontFamily: 'IBM Plex Mono,monospace', outline: 'none', textAlign: 'right' }}
          />
        ) : (
          <div
            onClick={() => setScaleInput(true)}
            title="클릭하여 배율 직접 입력"
            style={{ padding: '4px 10px', fontSize: 11, background: '#fff', border: '1px solid #d4d4d4', borderRadius: 4, color: '#555', fontFamily: 'IBM Plex Mono,monospace', cursor: 'pointer', minWidth: 52, textAlign: 'right' }}
          >
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>

      {/* 캔버스 */}
      <div style={{ position: 'absolute', transformOrigin: '0 0', transform: `translate(${panX}px,${panY}px) scale(${scale})`, willChange: 'transform', width: layout.totalW, height: layout.totalH }}>

        {/* 뷰 박스 */}
        {Object.entries(viewPos).map(([vn, vp]) => {
          const vc = viewColors[vn] || VIEW_PALETTE[0]
          return (
            <div key={vn} style={{ position: 'absolute', left: vp.x, top: vp.y, width: vp.w, height: vp.h, background: vc.bg, border: `1.5px solid ${vc.bd}`, borderRadius: 10, zIndex: 0 }}>
              <span style={{ position: 'absolute', top: 12, left: 14, fontSize: 12, fontWeight: 700, color: vc.label, letterSpacing: '.04em', fontFamily: 'IBM Plex Mono,monospace' }}>{vn}</span>
            </div>
          )
        })}

        {/* 도메인 박스 */}
        {Object.entries(domainAbsPos).map(([dk, dp]) => {
          const dc    = domainColors[dk] || DOMAIN_PALETTE[0]
          const label = dk.split('/').slice(1).join('/')
          return (
            <div key={dk} style={{ position: 'absolute', left: dp.x, top: dp.y, width: dp.w, height: dp.h, background: dc.bg, border: `1px solid ${dc.bd}`, borderRadius: 6, zIndex: 1 }}>
              {label && <span style={{ position: 'absolute', top: 9, left: 12, fontSize: 10, fontWeight: 600, color: dc.main }}>{label}</span>}
            </div>
          )
        })}

        {/* 관계선 */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: layout.totalW, height: layout.totalH, pointerEvents: 'none', zIndex: 2, overflow: 'visible' }}>
          {relPaths.map(r => {
            const hi       = activeSet ? (activeSet.has(r.f) && activeSet.has(r.t)) : true
            const sameView = tbls[r.f]?.view === tbls[r.t]?.view
            return (
              <g key={r.i} opacity={hi ? 1 : 0.1}>
                <path d={r.d} fill="none" stroke={sameView ? '#9ca3af' : '#d1d5db'} strokeWidth={sameView ? 1.3 : 1} strokeDasharray={r.type === 'dim_ref' || !sameView ? '6,4' : undefined} />
                <CrowsMany x={r.x1} y={r.y1} dir={r.aDir} />
                <CrowsOne  x={r.x2} y={r.y2} dir={r.bDir} />
              </g>
            )
          })}
        </svg>

        {/* 테이블 카드 */}
        {Object.entries(tbls).map(([name, tbl]) => {
          const vc = viewColors[tbl.view] || VIEW_PALETTE[0]
          return (
            <TableCard key={name} name={name} tbl={tbl} viewColor={vc}
              isActive={activeSet ? activeSet.has(name) : false}
              isDimmed={activeSet ? !activeSet.has(name) : false}
              onHover={setHover} onLeave={() => setHover(null)} />
          )
        })}
      </div>

      {/* 수직 스크롤바 */}
      <Scrollbar axis="v" pan={panY} totalPx={totalHpx} containerPx={cSize.h} onDrag={makeScrollDrag('y')} />

      {/* 수평 스크롤바 */}
      <Scrollbar axis="h" pan={panX} totalPx={totalWpx} containerPx={cSize.w} onDrag={makeScrollDrag('x')} />

      {/* 범례 */}
      <div style={{ position: 'absolute', bottom: 14, left: 10, zIndex: 200, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 6, padding: '6px 14px', display: 'flex', gap: 16, fontSize: 11, color: '#666', alignItems: 'center' }}>
        <span><span style={{ color: '#d97706', fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace' }}>PK</span> Primary Key</span>
        <span><span style={{ color: '#059669', fontWeight: 700, fontFamily: 'IBM Plex Mono,monospace' }}>집계</span> Measure</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#9ca3af" strokeWidth="1.3"/></svg>뷰 내부
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="24" height="10"><line x1="0" y1="5" x2="24" y2="5" stroke="#d1d5db" strokeWidth="1" strokeDasharray="5,3"/></svg>뷰 간/차원
        </span>
        <span style={{ fontSize: 10, color: '#bbb' }}>스크롤: 상하이동 | Shift+스크롤: 좌우이동 | Ctrl+스크롤: 줌 | 드래그: 이동 | 호버: 하이라이트</span>
      </div>
    </div>
  )
}
