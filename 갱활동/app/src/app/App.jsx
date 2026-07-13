import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import ProtectedRoute from './ProtectedRoute'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Onboarding from '../pages/Onboarding'
import Pending from '../pages/Pending'
import SubmitTip from '../pages/SubmitTip'
import Browse from '../pages/Browse'
import Inbox from '../pages/Inbox'
import TipDetail from '../pages/TipDetail'

function Stub({ name }) { return <div className="container">{name}</div> }

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pending" element={<Pending />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<SubmitTip />} />
          <Route path="/browse" element={<Browse />} />
        </Route>
        <Route element={<ProtectedRoute need="intel"><Layout /></ProtectedRoute>}>
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<TipDetail />} />
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
