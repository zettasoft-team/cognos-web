import { useState } from 'react'
import DocumentList from './pages/DocumentList.jsx'
import DocumentDetail from './pages/DocumentDetail.jsx'

function App() {
  const [page, setPage] = useState('list')
  const [currentDoc, setCurrentDoc] = useState(null)

  const openDoc = (doc) => { setCurrentDoc(doc); setPage('detail') }
  const goBack  = () => { setPage('list'); setCurrentDoc(null) }

  return (
    <div className="app">
      {page === 'list'
        ? <div className="main"><DocumentList onOpen={openDoc} /></div>
        : <DocumentDetail doc={currentDoc} onBack={goBack} />
      }
    </div>
  )
}

export default App
