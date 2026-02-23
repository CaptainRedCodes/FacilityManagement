import { useState, useEffect } from "react"
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { DashboardLayout } from "@/components/layout"

type UserRole = "Admin" | "Supervisor" | "Employee"
type UserStatus = "Active" | "Inactive"

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  location_id: number | null
  location: { id: number; name: string } | null
  department_id: number | null
  department: { id: number; name: string } | null
  supervisor_id: number | null
  supervisor: { id: number; name: string } | null
  status: UserStatus
  created_at: string
  updated_at: string
}

interface Location {
  id: number
  name: string
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const [supervisors, setSupervisors] = useState<User[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"supervisors" | "employees">("supervisors")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee" as UserRole,
    location_id: null as number | null,
    supervisor_id: null as number | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [supervisorsRes, employeesRes, locationsRes] = await Promise.all([
        api.get("/users/supervisors"),
        api.get("/users/employees"),
        api.get("/locations"),
      ])
      setSupervisors(supervisorsRes.data)
      setEmployees(employeesRes.data)
      setLocations(locationsRes.data)
    } catch (err) {
      setError("Failed to load data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        location_id: formData.location_id,
        supervisor_id: formData.supervisor_id,
      }

      if (editingUser) {
        const updateData: Record<string, unknown> = {
          name: formData.name,
          role: formData.role,
          location_id: formData.location_id,
        }
        if (formData.role === "Employee") {
          updateData.supervisor_id = formData.supervisor_id
        }
        await api.put(`/users/${editingUser.id}`, updateData)
      } else {
        await api.post("/users", payload)
      }
      await fetchData()
      closeModal()
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } }
        setError(axiosError.response?.data?.detail || "An error occurred")
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      location_id: user.location_id,
      supervisor_id: user.supervisor_id,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to deactivate this user?")) return

    try {
      await api.delete(`/users/${userId}`)
      await fetchData()
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } }
        setError(axiosError.response?.data?.detail || "Failed to deactivate user")
      } else {
        setError("Failed to deactivate user")
      }
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "Employee",
      location_id: null,
      supervisor_id: null,
    })
    setError(null)
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "bg-purple-100 text-purple-700"
      case "Supervisor":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusBadgeColor = (status: UserStatus) => {
    return status === "Active"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700"
  }

  const getAvailableRoles = (): UserRole[] => {
    if (currentUser?.role === "Admin") {
      return ["Supervisor", "Employee"]
    }
    return ["Employee"]
  }

  const filteredEmployees = employees

  const getEmployeesBySupervisor = (supervisorId: number) => {
    return employees.filter(emp => Number(emp.supervisor_id) === supervisorId)
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Users" },
      ]}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      }
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={activeTab === "supervisors" ? "default" : "outline"}
            onClick={() => setActiveTab("supervisors")}
            className={activeTab === "supervisors" ? "bg-primary" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Supervisors ({supervisors.length})
          </Button>
          <Button
            variant={activeTab === "employees" ? "default" : "outline"}
            onClick={() => setActiveTab("employees")}
            className={activeTab === "employees" ? "bg-primary" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Employees ({employees.length})
          </Button>
        </div>

        {activeTab === "supervisors" && (
          <div className="space-y-6">
            {supervisors.map((supervisor) => (
              <Card key={supervisor.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {supervisor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{supervisor.name}</CardTitle>
                      <p className="text-sm text-slate-500">{supervisor.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(supervisor.role)}`}>
                      {supervisor.role}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(supervisor.status)}`}>
                      {supervisor.status}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(supervisor)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(supervisor.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-3">
                    Location: {supervisor.location?.name || "Not assigned"}
                  </p>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Employees under this supervisor ({getEmployeesBySupervisor(supervisor.id).length}):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {getEmployeesBySupervisor(supervisor.id).map((emp) => (
                        <div key={emp.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{emp.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getStatusBadgeColor(emp.status)}`}>
                            {emp.status}
                          </span>
                        </div>
                      ))}
                      {getEmployeesBySupervisor(supervisor.id).length === 0 && (
                        <p className="text-sm text-slate-500">No employees assigned</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {supervisors.length === 0 && (
              <div className="text-center py-8 text-slate-500">No supervisors found</div>
            )}
          </div>
        )}

        {activeTab === "employees" && (
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Supervisor</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground">{user.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{user.location?.name || "-"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{user.supervisor?.name || "-"}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(user)} className="cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-destructive cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEmployees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No employees found</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingUser ? "Edit User" : "Add User"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isSubmitting || editingUser !== null}
                  />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={isSubmitting}
                  >
                    {getAvailableRoles().map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <select
                    id="location"
                    value={formData.location_id || ""}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                {formData.role === "Employee" && (
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor</Label>
                    <select
                      id="supervisor"
                      value={formData.supervisor_id || ""}
                      onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="">Select supervisor</option>
                      {supervisors.map((sup) => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : editingUser ? (
                      "Update"
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
