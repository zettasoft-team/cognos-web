import { useState, useRef, useEffect } from 'react'

export default function EditableTable({ data, onChange }) {
  const [editCell, setEditCell] = useState(null) // { r, c }
  const [editVal, setEditVal]   = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editCell && inputRef.current) inputRef.current.focus()
  }, [editCell])

  const startEdit = (r, c, val) => {
    setEditCell({ r, c })
    setEditVal(val ?? '')
  }

  const commitEdit = () => {
    if (!editCell) return
    const newRows = data.rows.map((row, ri) =>
      ri === editCell.r
        ? row.map((cell, ci) => (ci === editCell.c ? editVal : cell))
        : row
    )
    onChange({ ...data, rows: newRows })
    setEditCell(null)
  }

  const addRow = () => {
    onChange({ ...data, rows: [...data.rows, data.columns.map(() => '')] })
  }

  const deleteRow = (ri) => {
    onChange({ ...data, rows: data.rows.filter((_, i) => i !== ri) })
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th className="row-idx">#</th>
            {data.columns.map((col, ci) => <th key={ci}>{col}</th>)}
            <th style={{ width: 50 }} />
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri}>
              <td className="row-idx">{ri + 1}</td>
              {row.map((cell, ci) => {
                const isEditing = editCell?.r === ri && editCell?.c === ci
                return (
                  <td key={ci}>
                    {isEditing ? (
                      <input
                        ref={inputRef}
                        className="cell-input"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEdit()
                          if (e.key === 'Escape') setEditCell(null)
                        }}
                      />
                    ) : (
                      <div
                        className={`cell-inner${!cell ? ' cell-null' : ''}`}
                        onClick={() => startEdit(ri, ci, cell)}
                      >
                        {cell || 'NULL'}
                      </div>
                    )}
                  </td>
                )
              })}
              <td style={{ padding: '0 8px' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', borderColor: 'transparent' }}
                  onClick={() => deleteRow(ri)}
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={data.columns.length + 2}>
              <div className="add-row-btn" onClick={addRow}>+ 행 추가</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
