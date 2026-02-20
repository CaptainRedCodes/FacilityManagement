import { useState, useEffect } from "react"
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Users, Clock, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { api } from "@/lib/api"
import { toast } from "sonner"
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

interface AttendanceRecord {
  id: number
  employee_id: number
  employee_name: string
  location_id: number
  location_name: string
  check_in_time: string
  check_out_time: string | null
  is_late: boolean
  late_by_minutes: number
  status: string
  date: string
}

export default function SupervisorDashboard() {
  const [employees, setEmployees] = useState<User[]>([])
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location_id: null as number | null,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [employeesRes, attendanceRes] = await Promise.all([
        api.get("/users/me/employees"),
        api.get("/attendance/all", { params: { page_size: 100 } }),
      ])
      setEmployees(employeesRes.data)
      setTodayAttendance(attendanceRes.data.items.filter((a: AttendanceRecord) => a.date === new Date().toISOString().split("T")[0]))
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
      if (editingEmployee) {
        await api.put(`/users/${editingEmployee.id}`, {
          name: formData.name,
        })
        toast.success("Employee updated successfully")
      } else {
        await api.post("/users", {
          ...formData,
          role: "Employee",
        })
        toast.success("Employee added successfully")
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

  const handleEdit = (employee: User) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      password: "",
      location_id: employee.location_id,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (employeeId: number) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return

    try {
      await api.delete(`/users/${employeeId}`)
      toast.success("Employee deactivated successfully")
      await fetchData()
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } }
        setError(axiosError.response?.data?.detail || "Failed to deactivate employee")
      } else {
        setError("Failed to deactivate employee")
      }
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingEmployee(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      location_id: null,
    })
    setError(null)
  }

  const getEmployeeAttendance = (employeeId: number) => {
    return todayAttendance.find(a => a.employee_id === employeeId)
  }

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "checked_out") {
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Checked Out</Badge>
    }
    if (isLate) {
      return <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200">Late</Badge>
    }
    return <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">Present</Badge>
  }

  const getCheckedInCount = () => {
    return todayAttendance.filter(a => a.status === "present").length
  }

  const getLateCount = () => {
    return todayAttendance.filter(a => a.is_late).length
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
        { label: "Dashboard", href: "/" },
        { label: "My Team" },
      ]}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-muted-foreground">Manage your employees and view their attendance</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={employees.length}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Checked In"
            value={getCheckedInCount()}
            icon={Clock}
            variant="success"
          />
          <StatsCard
            title="Late Arrivals"
            value={getLateCount()}
            icon={AlertCircle}
            variant="warning"
          />
          <StatsCard
            title="Not Checked In"
            value={employees.length - getCheckedInCount()}
            icon={MapPin}
            variant="danger"
          />
        </div>

        {employees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => {
              const attendance = getEmployeeAttendance(employee.id)
              return (
              <Card key={employee.id} className="hover:shadow-md transition-shadow border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)} className="cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)} className="text-destructive cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground">{employee.location?.name || "Not assigned"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        {attendance 
                          ? getStatusBadge(attendance.status, attendance.is_late)
                          : <Badge variant="destructive">Absent</Badge>
                        }
                      </div>
                      {attendance && (
                        <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
                          <p>Check-in: {new Date(attendance.check_in_time).toLocaleTimeString()}</p>
                          {attendance.is_late && (
                            <p className="text-amber-600">Late by {attendance.late_by_minutes} mins</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                icon={Users}
                title="No employees yet"
                description="Add your first employee to get started tracking their attendance."
                actionLabel="Add Employee"
                onAction={() => setIsModalOpen(true)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingEmployee ? "Edit Employee" : "Add Employee"}</CardTitle>
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
                    disabled={isSubmitting || editingEmployee !== null}
                  />
                </div>
                {!editingEmployee && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingEmployee}
                      disabled={isSubmitting}
                    />
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
                    ) : editingEmployee ? (
                      "Update"
                    ) : (
                      "Add Employee"
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
