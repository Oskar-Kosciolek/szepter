import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSupabaseSession } from '../hooks/useSupabaseSession'
import { useRealtime } from '../hooks/useRealtime'
import { LoginPage } from './LoginPage'
import { VerifyPage } from './VerifyPage'
import { NotesPage } from './NotesPage'
import { ListsPage } from './ListsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabaseSession()
  useRealtime()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route
          path="/"
          element={<ProtectedRoute><NotesPage /></ProtectedRoute>}
        />
        <Route
          path="/lists"
          element={<ProtectedRoute><ListsPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
