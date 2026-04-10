const W = 170, ROW_H = 20, HEADER_H = 28
const nodeH = (n) => HEADER_H + (n.columns?.length ?? 0) * ROW_H + 8
const COL_GAP = 60, ROW_GAP = 40, COLS = 2

function layoutNodes(nodes) {
  return nodes.map((n, i) => ({
    ...n,
    x: 40 + (i % COLS) * (W + COL_GAP),
    y: 40 + Math.floor(i / COLS) * (maxNodeH(nodes, i) + ROW_GAP),
  }))
}
function maxNodeH(nodes, i) {
  const s = Math.floor(i / COLS) * COLS
  return Math.max(...nodes.slice(s, s + COLS).map(nodeH))
}
function svgWidth(nodes)  { return 40 + COLS * (W + COL_GAP) + 40 }
function svgHeight(nodes) {
  const rows = Math.ceil(nodes.length / COLS)
  let h = 40
  for (let r = 0; r < rows; r++) {
    const slice = nodes.slice(r * COLS, r * COLS + COLS)
    h += Math.max(...slice.map(nodeH)) + ROW_GAP
  }
  return h + 20
}

function ErdContent({ erdData }) {
  const nodes   = layoutNodes(erdData?.nodes ?? [])
  const edges   = erdData?.edges ?? []
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  if (nodes.length === 0)
    return (
      <div className="empty-state">
        <div className="empty-title">ERD 데이터가 없습니다</div>
        <div>테이블 목록·조인 관계 탭에 데이터를 입력하면 생성됩니다.</div>
      </div>
    )

  return (
    <>
      <svg className="erd-svg" viewBox={`0 0 ${svgWidth(nodes)} ${svgHeight(nodes)}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#a09d95" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const f = nodeMap[e.from_], t = nodeMap[e.to]
          if (!f || !t) return null
          const x1 = f.x + W, y1 = f.y + nodeH(f) / 2
          const x2 = t.x,     y2 = t.y + nodeH(t) / 2
          const mx = (x1 + x2) / 2
          return (
            <g key={i}>
              <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
                fill="none" stroke="#a09d95" strokeWidth="1.5" markerEnd="url(#arr)" />
              <text x={mx} y={(y1 + y2) / 2 - 4} textAnchor="middle"
                fontSize="9" fill="#9b9890" fontFamily="IBM Plex Mono, monospace">
                {e.label}
              </text>
            </g>
          )
        })}

        {nodes.map((n, ni) => {
          const nh = nodeH(n)
          return (
            <g key={ni} transform={`translate(${n.x},${n.y})`}>
              <rect width={W} height={nh} fill="#fff" stroke="#d8d5cc" strokeWidth="1" rx="2" />
              <rect width={W} height={HEADER_H} fill="#1a1917" rx="2" />
              <rect width={W} height={4} fill="#1a1917" y={HEADER_H - 4} />
              <text x={W / 2} y={HEADER_H / 2 + 5} textAnchor="middle"
                fontSize="10" fontWeight="600" fill="#fff" fontFamily="IBM Plex Mono, monospace">
                {n.label}
              </text>
              {(n.columns ?? []).map((col, ci) => (
                <g key={ci}>
                  <line x1={0} y1={HEADER_H + ci * ROW_H} x2={W} y2={HEADER_H + ci * ROW_H}
                    stroke="#eae8e3" strokeWidth="0.5" />
                  <text x={8} y={HEADER_H + ci * ROW_H + 13} fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={col.includes('PK') ? '#c0392b' : col.includes('FK') ? '#4a7cf7' : '#6b6860'}>
                    {col}
                  </text>
                </g>
              ))}
            </g>
          )
        })}
      </svg>
      <div className="erd-legend">
        <span><span style={{ color: '#c0392b', fontFamily: 'var(--mono)' }}>PK</span> Primary Key</span>
        <span><span style={{ color: '#4a7cf7', fontFamily: 'var(--mono)' }}>FK</span> Foreign Key</span>
      </div>
    </>
  )
}

export default function ERDModal({ erdData, onClose, inline = false }) {
  if (inline) {
    return (
      <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>
        <ErdContent erdData={erdData} />
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>ERD 다이어그램</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <ErdContent erdData={erdData} />
        </div>
      </div>
    </div>
  )
}
