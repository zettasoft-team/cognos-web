import { useState } from 'react'
import DocumentList from './DocumentList.jsx'
import DocumentDetail from './DocumentDetail.jsx'

// DocumentList / DocumentDetail 을 그대로 재사용.
// Shell 내부의 content 영역에 렌더링됨.
export default function Models() {
  const [view, setView] = useState('list')
  const [currentDoc, setCurrentDoc] = useState(null)

  const openDoc = (doc) => { setCurrentDoc(doc); setView('detail') }
  const goBack  = () => { setView('list'); setCurrentDoc(null) }

  if (view === 'detail') {
    // detail은 전체 높이 IDE 레이아웃이므로 content padding을 상쇄
    return (
      <div style={{ margin: '-24px -32px', height: 'calc(100vh)' }}>
        <DocumentDetail doc={currentDoc} onBack={goBack} />
      </div>
    )
  }
  return <DocumentList onOpen={openDoc} />
}
