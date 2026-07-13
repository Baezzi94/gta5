import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'

function Stub({ name }) { return <div className="container">{name}</div> }

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="*" element={<Stub name="BLACK OUT" />} />
      </Routes>
    </AuthProvider>
  )
}
