import { useState, useEffect } from "react"
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Users, Clock, MapPin, CheckCircle2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { EmptyState } from "@/components/ui/empty-state"
import { CheckInButton } from "@/components/CheckInButton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { api } from "@/lib/api"
import { attendanceApi, AttendanceRecord } from "@/api/attendance"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/layout"
import { useAuth } from "@/contexts/AuthContext"

interface User {
  id: number
  name: string
  email: string
  role: string
  location_id: number | null
  location: { id: number; name: string } | null
  department_id: number | null
  supervisor_id: number | null
  status: string
  created_at: string
  updated_at: string
}

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<User[]>([])
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [locations, setLocations] = useState<{id: number, name: string}[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location_id: null as number | null,
    role: "Employee" as "Employee" | "Supervisor",
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [employeesRes, attendanceRes, myAttendanceRes, locationsRes, historyRes] = await Promise.all([
        api.get("/users/me/employees"),
        api.get("/attendance/all", { params: { page_size: 100 } }),
        attendanceApi.getTodayAttendance(),
        api.get("/locations"),
        attendanceApi.getHistory(),
      ])
      setEmployees(employeesRes.data)
      setMyAttendance(myAttendanceRes)
      setLocations(locationsRes.data)
      setHistory(historyRes)
      const today = new Date().toISOString().split("T")[0]
      setTodayAttendance(attendanceRes.data.items.filter((a: AttendanceRecord) => a.date === today))
    } catch (err) {
      setError("Failed to load data")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckInSuccess = (attendance: AttendanceRecord | null) => {
    if (attendance) {
      setMyAttendance(attendance)
      fetchData()
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    try {
      const result = await attendanceApi.checkout()
      setMyAttendance(result)
      toast.success("Checked out successfully")
      fetchData()
    } catch (error) {
      toast.error("Failed to check out. Please try again.")
    } finally {
      setIsCheckingOut(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getWorkingDuration = () => {
    if (!myAttendance?.check_in_time) return "0 hrs 0 mins"
    const checkIn = new Date(myAttendance.check_in_time)
    const checkOut = myAttendance.check_out_time
      ? new Date(myAttendance.check_out_time)
      : currentTime
    const diff = checkOut.getTime() - checkIn.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} hrs ${minutes} mins`
  }

  const getWeeklyHours = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek)
    startOfWeek.setHours(0, 0, 0, 0)
    
    let totalMinutes = 0
    for (const record of history) {
      const recordDate = new Date(record.date)
      if (recordDate >= startOfWeek && recordDate <= now) {
        if (record.check_in_time) {
          const checkIn = new Date(record.check_in_time)
          const checkOut = record.check_out_time ? new Date(record.check_out_time) : now
          const diff = checkOut.getTime() - checkIn.getTime()
          totalMinutes += diff / (1000 * 60)
        }
      }
    }
    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)
    return `${hours} hrs ${minutes} mins`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isCheckedIn = myAttendance !== null && myAttendance.status === "present"
  const isCheckedOut = myAttendance?.status === "checked_out"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (editingEmployee) {
        await api.put(`/users/${editingEmployee.id}`, {
          name: formData.name,
        })
        toast.success("User updated successfully")
      } else {
        await api.post("/users", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          location_id: formData.location_id,
          role: formData.role,
        })
        toast.success(`${formData.role} added successfully`)
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
      role: employee.role as "Employee" | "Supervisor",
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
      role: "Employee" as "Employee" | "Supervisor",
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
    const employeeIds = new Set(employees.map(e => e.id))
    return todayAttendance.filter(a => employeeIds.has(a.employee_id) && (a.status === "present" || a.status === "checked_out")).length
  }

  const getLateCount = () => {
    const employeeIds = new Set(employees.map(e => e.id))
    return todayAttendance.filter(a => employeeIds.has(a.employee_id) && a.is_late).length
  }

  const getNotCheckedInCount = () => {
    const employeeIds = new Set(employees.map(e => e.id))
    return todayAttendance.filter(a => employeeIds.has(a.employee_id) && a.status === "not_marked").length
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
    >
      <div className="space-y-6">
        {/* My Attendance Section */}
        <Card className="shadow-lg border-border">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4">
                <Clock className="w-8 h-8 text-primary-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{formatTime(currentTime)}</p>
              <p className="text-muted-foreground mt-1">Your assigned location: <strong>{typeof user?.location === 'object' ? user?.location?.name : user?.location || "Not assigned"}</strong></p>
            </div>

            {!isCheckedIn && !isCheckedOut && (
              <div className="text-center space-y-4">
                <CheckInButton onSuccess={handleCheckInSuccess} />
                <p className="text-sm text-muted-foreground">Tap the button above to check in</p>
              </div>
            )}

            {isCheckedIn && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xl font-semibold text-foreground">You're checked in</span>
                </div>

                {myAttendance?.is_late && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    You checked in {myAttendance.late_by_minutes} minutes late
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">Check-in Time</p>
                    <p className="text-xl font-semibold text-foreground">
                      {formatDateTime(myAttendance?.check_in_time || "")}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">Today's Duration</p>
                    <p className="text-xl font-semibold text-foreground">{getWorkingDuration()}</p>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto w-full">
                  <p className="text-muted-foreground text-sm">This Week's Total</p>
                  <p className="text-xl font-semibold text-foreground">{getWeeklyHours()}</p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full max-w-sm cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Check Out
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ready to leave?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to check out? Make sure you've completed your work for the day.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCheckOut}
                        disabled={isCheckingOut}
                        className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                      >
                        {isCheckingOut ? "Checking out..." : "Check Out"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {isCheckedOut && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xl font-semibold text-foreground">You've checked out</span>
                </div>
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">Check-in Time</p>
                    <p className="text-xl font-semibold text-foreground">
                      {formatDateTime(myAttendance?.check_in_time || "")}
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-muted-foreground text-sm">Check-out Time</p>
                    <p className="text-xl font-semibold text-foreground">
                      {formatDateTime(myAttendance?.check_out_time || "")}
                    </p>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-4 max-w-sm mx-auto w-full">
                  <p className="text-muted-foreground text-sm">This Week's Total</p>
                  <p className="text-xl font-semibold text-foreground">{getWeeklyHours()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Team Management</h2>
            <p className="text-muted-foreground">Manage your employees and view their attendance</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
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
            value={getNotCheckedInCount()}
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
              <CardTitle>{editingEmployee ? "Edit User" : `Add ${formData.role}`}</CardTitle>
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
                  <>
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
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <select
                        id="location"
                        value={formData.location_id || ""}
                        onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        disabled={isSubmitting}
                        required
                      >
                        <option value="">Select location</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "Employee" | "Supervisor" })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        disabled={isSubmitting}
                      >
                        <option value="Employee">Employee</option>
                        <option value="Supervisor">Supervisor</option>
                      </select>
                    </div>
                  </>
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
                      `Add ${formData.role}`
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
