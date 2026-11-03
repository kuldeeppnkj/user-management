import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { useAuth } from './auth/useAuth'
import { AuthPage } from './pages/AuthPage'
import { DirectoryPage, ProfilePage, Workspace } from './pages/Workspace'

function AuthenticatedRoutes() {
  const { session } = useAuth()
  return session ? <Outlet /> : <Navigate to="/login" replace />
}

function RootRedirect() {
  const { session } = useAuth()
  return <Navigate to={session?.user.role === 'admin' ? '/users' : '/profile'} replace />
}

function AppRoutes() {
  const { session } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={session ? <RootRedirect /> : <AuthPage mode="login" />} />
      <Route path="/register" element={session ? <RootRedirect /> : <AuthPage mode="register" />} />
      <Route element={<AuthenticatedRoutes />}>
        <Route element={<Workspace />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/users" element={<DirectoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
