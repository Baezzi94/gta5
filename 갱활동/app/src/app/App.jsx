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
import Persons from '../pages/Persons'
import PersonDetail from '../pages/PersonDetail'
import Admin from '../pages/Admin'
import IntelRP from '../pages/IntelRP'
import Reports from '../pages/Reports'
import ReportCompose from '../pages/ReportCompose'
import ReportDetail from '../pages/ReportDetail'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/pending" element={<Pending />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<IntelRP />} />
          <Route path="/rp" element={<IntelRP />} />
          <Route path="/submit" element={<SubmitTip />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/new" element={<ReportCompose />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
        </Route>
        <Route element={<ProtectedRoute need="intel"><Layout /></ProtectedRoute>}>
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/inbox/:id" element={<TipDetail />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/persons/:id" element={<PersonDetail />} />
        </Route>
        <Route element={<ProtectedRoute need="admin"><Layout /></ProtectedRoute>}>
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
