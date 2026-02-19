import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, getUserDisplayName } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">WorkSight</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600 mb-8">Welcome back, {user?.name}!</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Your Profile</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><span className="font-medium">Name:</span> {user?.name}</p>
              <p><span className="font-medium">Email:</span> {user?.email}</p>
              <p><span className="font-medium">Role:</span> {user?.role}</p>
              <p><span className="font-medium">Location:</span> {getUserDisplayName(user?.location ?? null)}</p>
              <p><span className="font-medium">Department:</span> {getUserDisplayName(user?.department ?? null)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Account Status</h3>
            <div className="space-y-2 text-sm">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                user?.status === "Active" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {user?.status}
              </span>
            </div>
          </div>

          {user?.role === "Admin" && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Admin Access</h3>
              <p className="text-sm text-slate-600">
                You have full access to manage users, locations, and departments.
              </p>
            </div>
          )}

          {user?.role === "Supervisor" && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Supervisor Access</h3>
              <p className="text-sm text-slate-600">
                You can view users in your location.
              </p>
            </div>
          )}

          {user?.role === "Employee" && (
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-slate-900 mb-2">Employee Access</h3>
              <p className="text-sm text-slate-600">
                You can view your own profile and track attendance.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
