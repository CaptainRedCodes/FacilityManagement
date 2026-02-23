import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Toaster } from "sonner"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/Login"
import AdminDashboard from "@/pages/admin/Dashboard"
import AdminUsersPage from "@/pages/admin/Users"
import AdminAttendancePage from "@/pages/admin/Attendance"
import AdminLocationsPage from "@/pages/admin/Locations"
import AdminDepartmentsPage from "@/pages/admin/Departments"
import AdminShiftsPage from "@/pages/admin/Shifts"
import AdminAnalyticsPage from "@/pages/admin/Analytics"
import EmployeeDashboard from "@/pages/EmployeeDashboard"
import SupervisorDashboard from "@/pages/SupervisorDashboard"

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  const getDefaultRoute = () => {
    if (!user) return "/login"
    switch (user.role) {
      case "Admin":
        return "/dashboard"
      case "Supervisor":
        return "/dashboard/supervisor"
      case "Employee":
        return "/dashboard/employee"
      default:
        return "/dashboard"
    }
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={user ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/supervisor"
        element={
          <ProtectedRoute allowedRoles={["Supervisor"]}>
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employee"
        element={
          <ProtectedRoute allowedRoles={["Employee"]}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Supervisor"]}>
            <AdminAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/locations"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminLocationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shifts"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminShiftsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Supervisor"]}>
            <AdminAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? getDefaultRoute() : "/"} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
