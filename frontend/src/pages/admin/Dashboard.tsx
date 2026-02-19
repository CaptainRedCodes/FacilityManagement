import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Building2, Users, Clock, MapPin, AlertCircle, CheckCircle2, LogOut, Calendar, BarChart3, Plus, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
import { QuickAction } from "@/components/ui/quick-action"
import { useAuth } from "@/contexts/AuthContext"
import { dashboardApi, DashboardStats, AttendanceRecord } from "@/api/admin"
import { DashboardLayout } from "@/components/layout"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])
  const [_isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [statsData, attendanceData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTodayAttendance(),
      ])
      setStats(statsData)
      setTodayAttendance(attendanceData)
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "checked_out") {
      return <Badge variant="info">Checked Out</Badge>
    }
    if (isLate) {
      return <Badge variant="warning">Late</Badge>
    }
    return <Badge variant="success">Present</Badge>
  }

  const checkedInNow = todayAttendance.filter(a => a.status === "present")
  const checkedOut = todayAttendance.filter(a => a.status === "checked_out")

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Admin" },
      ]}
      actions={
        <Link to="/admin/users">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user?.name}! Here's what's happening today.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total Employees"
            value={stats?.total_employees || 0}
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Present Today"
            value={stats?.today_present || 0}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Late Arrivals"
            value={stats?.today_late || 0}
            icon={AlertCircle}
            variant="warning"
          />
          <StatsCard
            title="Absent Today"
            value={stats?.today_absent || 0}
            icon={MapPin}
            variant="danger"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/users">
            <QuickAction
              icon={UserPlus}
              label="Add User"
              description="Create new employee"
              variant="primary"
            />
          </Link>
          <Link to="/admin/attendance">
            <QuickAction
              icon={Calendar}
              label="View Attendance"
              description="Check records"
            />
          </Link>
          <Link to="/admin/analytics">
            <QuickAction
              icon={BarChart3}
              label="Analytics"
              description="View insights"
            />
          </Link>
          <Link to="/admin/locations">
            <QuickAction
              icon={MapPin}
              label="Locations"
              description="Manage sites"
            />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/admin/locations" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Locations</p>
                  <p className="text-sm text-slate-600">Manage work sites</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/departments" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold">Departments</p>
                  <p className="text-sm text-slate-600">Organize teams</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/shifts" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold">Shifts</p>
                  <p className="text-sm text-slate-600">Configure schedules</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Currently Checked In ({checkedInNow.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkedInNow.length === 0 ? (
                <p className="text-slate-500 text-sm">No one checked in yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checkedInNow.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {record.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.employee_name}</p>
                          <p className="text-xs text-slate-500">{record.location_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(record.status, record.is_late)}
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(record.check_in_time).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-blue-600" />
                Checked Out Today ({checkedOut.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {checkedOut.length === 0 ? (
                <p className="text-slate-500 text-sm">No one checked out yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checkedOut.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-sm font-medium">
                          {record.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.employee_name}</p>
                          <p className="text-xs text-slate-500">{record.location_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="info">Checked Out</Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
