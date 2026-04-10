import { useState, useRef, useEffect, useCallback } from 'react'
import { fetchAllSheets } from '../api/sheets.js'
import { exportExcel, importExcel, exportXml, fetchErd, fetchTree } from '../api/export.js'
import { fetchDocument } from '../api/documents.js'
import TreeExplorer from '../components/TreeExplorer.jsx'
import PropertiesPanel from '../components/PropertiesPanel.jsx'
import ERDModal from '../components/ERDModal.jsx'
import Notification from '../components/Notification.jsx'

const CENTER_TABS = [
  { id: 'explorer', label: '탐색기' },
  { id: 'erd',      label: 'ERD 다이어그램' },
  { id: 'dimmap',   label: '차원맵' },
]

export default function DocumentDetail({ doc, onBack }) {
  const [tree, setTree]               = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [centerTab, setCenterTab]     = useState('explorer')
  const [tableData, setTableData]     = useState({})
  const [erdData, setErdData]         = useState(null)
  const [docMeta, setDocMeta]         = useState(doc)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [notif, setNotif]             = useState(null)
  const xlsxRef = useRef(null)

  const notify = useCallback((msg) => setNotif(msg), [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchDocument(doc.id), fetchAllSheets(doc.id), fetchTree(doc.id)])
      .then(([meta, sheets, treeData]) => {
        setDocMeta(meta)
        setTableData(sheets)
        setTree(treeData)
      })
      .catch(e => notify(`로드 실패: ${e.message}`))
      .finally(() => setLoading(false))
  }, [doc.id])

  useEffect(() => {
    if (centerTab === 'erd' && !erdData) {
      fetchErd(doc.id).then(setErdData).catch(e => notify(`ERD 로드 실패: ${e.message}`))
    }
  }, [centerTab])

  const handleExcelDown = async () => {
    try { await exportExcel(doc.id); notify('Excel 다운로드 완료') }
    catch (e) { notify(`다운로드 실패: ${e.message}`) }
  }

  const handleExcelUp = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    try {
      await importExcel(doc.id, file)
      const [sheets, treeData] = await Promise.all([fetchAllSheets(doc.id), fetchTree(doc.id)])
      setTableData(sheets); setTree(treeData)
      notify('Excel 업로드 완료')
    } catch (e) { notify(`업로드 실패: ${e.message}`) }
  }

  const handleXmlGen = async () => {
    try { await exportXml(doc.id); notify('Cognos XML 재생성 완료') }
    catch (e) { notify(`재생성 실패: ${e.message}`) }
  }

  /* ── 탐색기 탭 ── */
  const renderExplorer = () => {
    if (!selectedNode)
      return <div className="explorer-hint">좌측 트리에서 오브젝트를 선택하세요.</div>

    if (selectedNode.type === 'querySubject') {
      const cols = tableData['column_mapping']?.rows?.filter(r => r[0] === selectedNode.label) ?? []
      return (
        <div className="explorer-table-wrap">
          <div className="explorer-table-title">
            {selectedNode.label}
            <span className="explorer-table-sub">{selectedNode.physical}</span>
          </div>
          <table className="explorer-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>컬럼명(논리)</th>
                <th>컬럼명(물리)</th>
                <th>데이터타입</th>
                <th>용도</th>
                <th style={{ width: 40 }}>PK</th>
                <th style={{ width: 50 }}>NULL</th>
              </tr>
            </thead>
            <tbody>
              {cols.length === 0
                ? <tr><td colSpan={7} className="explorer-empty-cell">컬럼 없음</td></tr>
                : cols.map((c, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'row-alt' : ''}>
                    <td className="col-num">{i + 1}</td>
                    <td className="col-name">{c[1]}</td>
                    <td className="col-mono">{c[2]}</td>
                    <td className="col-mono col-muted">{c[3]}</td>
                    <td className="col-muted">{c[4]}</td>
                    <td>{c[5] === 'Y' ? <span className="badge-pk">PK</span> : ''}</td>
                    <td className="col-muted">{c[6]}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )
    }

    return (
      <div className="explorer-hint">
        <div className="explorer-hint-title">{selectedNode.label}</div>
        {selectedNode.children?.length > 0 &&
          <div>하위 항목: {selectedNode.children.length}개</div>}
      </div>
    )
  }

  /* ── 차원맵 탭 ── */
  const renderDimMap = () => {
    const dimRows = tableData['dimension_view']?.rows ?? []
    if (dimRows.length === 0)
      return <div className="explorer-hint">차원 데이터가 없습니다.</div>

    const dims = {}
    dimRows.forEach(([dim, hier, lv]) => {
      if (!dims[dim]) dims[dim] = {}
      if (!dims[dim][hier]) dims[dim][hier] = []
      dims[dim][hier].push(lv)
    })

    return (
      <div className="dimmap-wrap">
        {Object.entries(dims).map(([dim, hiers]) => (
          <div key={dim} className="dimmap-card">
            <div className="dimmap-dim">{dim}</div>
            {Object.entries(hiers).map(([hier, levels]) => (
              <div key={hier} className="dimmap-hier">
                <div className="dimmap-hier-label">{hier}</div>
                <div className="dimmap-levels">
                  {levels.map((lv, i) => (
                    <span key={i} className="dimmap-level">{lv}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  /* ── ERD 탭 ── */
  const renderErd = () => {
    if (!erdData) return <div className="explorer-hint">ERD 로딩 중...</div>
    return <ERDModal erdData={erdData} inline />
  }

  return (
    <div className="detail-layout">
      {notif && <Notification msg={notif} onDone={() => setNotif(null)} />}

      {/* 상단 헤더 */}
      <div className="detail-header">
        <div className="detail-header-left">
          <button className="d-btn-back" onClick={onBack}>← 목록</button>
          <div>
            <div className="detail-title">{docMeta.name}</div>
            <div className="detail-subtitle">
              업로드: {docMeta.upload_date}
              {saving && <span className="saving-indicator">저장 중...</span>}
            </div>
          </div>
        </div>
        <div className="detail-header-right">
          <button className="d-btn-outline" onClick={handleExcelDown}>Excel 다운로드</button>
          <button className="d-btn-outline" onClick={() => xlsxRef.current.click()}>Excel 업로드</button>
          <input type="file" ref={xlsxRef} accept=".xlsx,.xls" onChange={handleExcelUp} />
          <button className="d-btn-primary" onClick={handleXmlGen}>Cognos XML 재생성</button>
        </div>
      </div>

      {/* 본문 */}
      <div className="detail-body">

        {/* 좌측 트리 (전체 높이) */}
        <div className="detail-tree">
          <div className="detail-tree-header">프로젝트 뷰어</div>
          {loading
            ? <div className="tree-empty">로딩 중...</div>
            : <TreeExplorer tree={tree} selectedId={selectedNode?.id} onSelect={setSelectedNode} />
          }
        </div>

        {/* 우측: 탭 + 콘텐츠 + 하단 패널 */}
        <div className="detail-center">

          {/* 탭 */}
          <div className="center-tabs">
            {CENTER_TABS.map(t => (
              <div
                key={t.id}
                className={`center-tab${centerTab === t.id ? ' active' : ''}`}
                onClick={() => setCenterTab(t.id)}
              >
                {t.label}
              </div>
            ))}
          </div>

          {/* 콘텐츠 */}
          <div className="center-content">
            {loading
              ? <div className="explorer-hint">로딩 중...</div>
              : centerTab === 'explorer' ? renderExplorer()
              : centerTab === 'erd'      ? renderErd()
              : renderDimMap()
            }
          </div>

          {/* 하단 오브젝트 정보 패널 (중앙 탭 아래에만) */}
          <PropertiesPanel selectedNode={selectedNode} />

        </div>
      </div>
    </div>
  )
}
