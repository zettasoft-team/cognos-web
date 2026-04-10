import { useState } from 'react'

const TYPE_DOT = {
  namespace:    { bg: '#dbeafe', border: '#93c5fd' },
  folder:       { bg: '#fef3c7', border: '#fcd34d' },
  querySubject: { bg: '#bfdbfe', border: '#93c5fd' },
  queryItem:    { bg: '#e5e7eb', border: '#d1d5db' },
  dimension:    { bg: '#e9d5ff', border: '#c4b5fd' },
  hierarchy:    { bg: '#ddd6fe', border: '#c4b5fd' },
  level:        { bg: '#ede9fe', border: '#c4b5fd' },
  measure:      { bg: '#fce7f3', border: '#f9a8d4' },
  relationship: { bg: '#d1fae5', border: '#6ee7b7' },
}

function TypeDot({ type }) {
  const style = TYPE_DOT[type] || TYPE_DOT.queryItem
  return (
    <span style={{
      display: 'inline-block',
      width: 7, height: 7,
      borderRadius: 2,
      background: style.bg,
      border: `1px solid ${style.border}`,
      flexShrink: 0,
      marginRight: 5,
    }} />
  )
}

function TreeNode({ node, depth = 0, selectedId, onSelect }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  const isSelected  = selectedId === node.id

  return (
    <div>
      <div
        className={`tree-node${isSelected ? ' tree-node-selected' : ''}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => {
          if (hasChildren) setOpen(o => !o)
          onSelect(node)
        }}
      >
        <span className="tree-arrow">
          {hasChildren ? (open ? '▾' : '▸') : ''}
        </span>
        <TypeDot type={node.type} />
        <span className="tree-label">{node.label}</span>
      </div>

      {open && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TreeExplorer({ tree, selectedId, onSelect }) {
  if (!tree || tree.length === 0) {
    return (
      <div className="tree-empty">
        <div>데이터 없음</div>
        <div style={{ fontSize: 11, marginTop: 4, color: '#bbb' }}>
          XML을 업로드하면 구조가 표시됩니다.
        </div>
      </div>
    )
  }

  return (
    <div className="tree-container">
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
