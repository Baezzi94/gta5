import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Onboarding from '../pages/Onboarding'
import Pending from '../pages/Pending'

function Stub({ name }) { return <div className="container">{name}</div> }

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pending" element={<Pending />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Stub name="정보 제공" />} />
          <Route path="/browse" element={<Stub name="정보 열람" />} />
        </Route>
        <Route element={<ProtectedRoute need="intel"><Layout /></ProtectedRoute>}>
          <Route path="/inbox" element={<Stub name="접수함" />} />
          <Route path="/inbox/:id" element={<Stub name="제보 상세" />} />
          <Route path="/persons" element={<Stub name="인물 DB" />} />
          <Route path="/persons/:id" element={<Stub name="인물 상세" />} />
        </Route>
        <Route element={<ProtectedRoute need="admin"><Layout /></ProtectedRoute>}>
          <Route path="/admin" element={<Stub name="조직 관리" />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
