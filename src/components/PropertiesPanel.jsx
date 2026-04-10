import { useState, useRef, useCallback } from 'react'

const COLLAPSED_H = 34
const DEFAULT_H   = 220
const MIN_H       = 80
const MAX_H       = 500

function renderProps(node) {
  if (!node) return null

  const rows = []
  const add = (label, value) => {
    if (value !== undefined && value !== null && value !== '')
      rows.push({ label, value: String(value) })
  }

  add('유형',   node.type)
  add('논리명', node.label)
  add('물리명', node.physical)
  add('SQL',    node.sql)
  add('상태',   node.status)
  add('데이터타입', node.datatype)
  add('용도',   node.usage)
  add('PK',     node.pk)
  add('NULL허용', node.nullable)
  add('물리명', node.physical)
  add('집계방식', node.aggregate)
  add('표현식', node.expression)
  add('참조객체', node.refobj)
  add('Left',   node.left)
  add('Right',  node.right)
  add('Left 카디널리티',  node.leftCard)
  add('Right 카디널리티', node.rightCard)

  return rows
}

export default function PropertiesPanel({ selectedNode }) {
  const [expanded, setExpanded] = useState(false)
  const [height, setHeight]     = useState(DEFAULT_H)
  const dragging = useRef(false)
  const startY   = useRef(0)
  const startH   = useRef(0)

  const onMouseDown = useCallback((e) => {
    dragging.current = true
    startY.current   = e.clientY
    startH.current   = height
    e.preventDefault()

    const onMove = (e) => {
      if (!dragging.current) return
      const delta  = startY.current - e.clientY
      const newH   = Math.min(MAX_H, Math.max(MIN_H, startH.current + delta))
      setHeight(newH)
    }
    const onUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [height])

  const props = renderProps(selectedNode)
  const panelH = expanded ? height : COLLAPSED_H

  return (
    <div
      className="properties-panel"
      style={{ height: panelH, minHeight: panelH, position: 'relative' }}
    >
      {/* 드래그 핸들 (expanded 상태에서만) */}
      {expanded && (
        <div className="properties-drag-handle" onMouseDown={onMouseDown} />
      )}

      {/* 헤더 바 */}
      <div className="properties-bar">
        <span className="properties-bar-title">
          {selectedNode ? `${selectedNode.type} : ${selectedNode.label}` : '오브젝트 정보'}
        </span>
        <button
          className="properties-toggle"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded ? '▼ 접기' : '▲ 펼치기'}
        </button>
      </div>

      {/* 내용 */}
      {expanded && (
        <div className="properties-body">
          {!selectedNode ? (
            <div className="properties-empty">트리에서 오브젝트를 선택하세요.</div>
          ) : (
            <table className="properties-table">
              <tbody>
                {props.map((row, i) => (
                  <tr key={i}>
                    <td className="prop-label">{row.label}</td>
                    <td className="prop-value">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
