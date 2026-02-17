import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { DashboardPage } from './modules/dashboard/ui/DashboardPage'
import { ProposalsListPage } from './modules/proposals/ui/ProposalsListPage'
import { OverviewPage } from './modules/dashboard/ui/OverviewPage'
import { ClientsPage } from './modules/clients/ui/ClientsPage'
import { ServiceTypesPage } from './modules/service-types/ui/ServiceTypesPage'
import { LoginPage } from './modules/auth/ui/LoginPage'
import { RegisterPage } from './modules/auth/ui/RegisterPage'
import { useAuth } from './modules/auth/application/useAuth'
import { ThermaQuoteLogo } from './modules/shared/ui/ThermaQuoteLogo'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <ThermaQuoteLogo />
        {user ? (
          <div className="nav-links nav-right">
            <span className="company-chip">{user.companyName}</span>
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/proposals">Proposals</NavLink>
            <NavLink to="/proposals/new">New Proposal</NavLink>
            <NavLink to="/clients">Clients</NavLink>
            <NavLink to="/services">Services</NavLink>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="nav-links nav-right">
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </div>
        )}
      </nav>

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/proposals/new" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/proposals/new" replace /> : <RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proposals"
          element={
            <ProtectedRoute>
              <ProposalsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proposals/new"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proposals/:id/edit"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServiceTypesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
    </div>
  )
}

export default App
