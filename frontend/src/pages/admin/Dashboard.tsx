import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Users, Clock, MapPin, AlertCircle, CheckCircle2, Calendar, BarChart3, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { dashboardApi, DashboardStats, AttendanceRecord } from "@/api/admin"
import { DashboardLayout } from "@/components/layout"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsData, attendanceData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTodayAttendance(),
      ])
      setStats(statsData)
      setTodayAttendance(attendanceData)
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
    }
  }

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "checked_out") {
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Checked Out</Badge>
    }
    if (isLate) {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Late</Badge>
    }
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Present</Badge>
  }

  const checkedInNow = todayAttendance.filter(a => a.status === "present" && !a.check_out_time)

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
      ]}
      actions={
        <Link to="/admin/users">
          <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer text-sm h-9">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add User
          </Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Employees</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.total_employees || 0}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Present Today</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.today_present || 0}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Late Arrivals</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.today_late || 0}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Absent Today</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stats?.today_absent || 0}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/admin/users" className="block">
            <Card className="bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Users</p>
                  <p className="text-xs text-gray-500">Manage employees</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/attendance" className="block">
            <Card className="bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center">
                  <Calendar className="w-4.5 h-4.5 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Attendance</p>
                  <p className="text-xs text-gray-500">View records</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/analytics" className="block">
            <Card className="bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">View insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/locations" className="block">
            <Card className="bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow transition-all cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center">
                  <MapPin className="w-4.5 h-4.5 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Locations</p>
                  <p className="text-xs text-gray-500">Manage sites</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Two Columns */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Checked In */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  Currently Checked In
                  <Badge className="bg-gray-100 text-gray-700 border-gray-200">{checkedInNow.length}</Badge>
                </CardTitle>
                <Link to="/admin/attendance">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 cursor-pointer text-xs h-7">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {checkedInNow.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500">No one checked in yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checkedInNow.slice(0, 6).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {record.employee_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.employee_name}</p>
                          <p className="text-xs text-gray-500">{record.location_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(record.status, record.is_late)}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Present</p>
                      <p className="text-xs text-gray-500">On time & working</p>
                    </div>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">{stats?.today_present || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Late Arrivals</p>
                      <p className="text-xs text-gray-500">After grace period</p>
                    </div>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">{stats?.today_late || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-gray-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Absent</p>
                      <p className="text-xs text-gray-500">No check-in recorded</p>
                    </div>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">{stats?.today_absent || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
