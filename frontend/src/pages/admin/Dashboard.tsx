import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Users, Clock, MapPin, AlertCircle, CheckCircle2, LogOut, Calendar, BarChart3, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
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
      return <Badge variant="outline" className="bg-slate-100 text-slate-700">Checked Out</Badge>
    }
    if (isLate) {
      return <Badge variant="warning">Late</Badge>
    }
    return <Badge variant="success">Present</Badge>
  }

  const checkedInNow = todayAttendance.filter(a => a.status === "present" && !a.check_out_time)
  
  const attendanceRate = stats && stats.total_employees > 0 
    ? Math.round((stats.today_present / stats.total_employees) * 100)
    : 0

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h1>
            <p className="text-slate-600">Here's what's happening with your team today</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
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

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Today's Attendance Rate</p>
                <p className="text-4xl font-bold mt-1">{attendanceRate}%</p>
                <p className="text-indigo-100 text-sm mt-2">
                  {stats?.today_present || 0} of {stats?.total_employees || 0} employees present
                </p>
              </div>
              <div className="w-20 h-20">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${attendanceRate}, 100`}
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-4 gap-4">
          <Link to="/admin/users" className="block">
            <Card className="hover:shadow-md transition-all hover:border-indigo-300 cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Users</p>
                  <p className="text-sm text-slate-500">Manage employees</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/attendance" className="block">
            <Card className="hover:shadow-md transition-all hover:border-indigo-300 cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Attendance</p>
                  <p className="text-sm text-slate-500">View records</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/analytics" className="block">
            <Card className="hover:shadow-md transition-all hover:border-indigo-300 cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Analytics</p>
                  <p className="text-sm text-slate-500">View insights</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/admin/locations" className="block">
            <Card className="hover:shadow-md transition-all hover:border-indigo-300 cursor-pointer h-full">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Locations</p>
                  <p className="text-sm text-slate-500">Manage sites</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Currently Checked In
                <Badge variant="secondary" className="ml-2">{checkedInNow.length}</Badge>
              </CardTitle>
              <Link to="/admin/attendance">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {checkedInNow.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-sm">No one checked in yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checkedInNow.slice(0, 8).map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                          {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {checkedInNow.length > 8 && (
                    <Link to="/admin/attendance">
                      <Button variant="ghost" size="sm" className="w-full text-slate-500">
                        +{checkedInNow.length - 8} more
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <LogOut className="w-5 h-5 text-slate-600" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">Present</p>
                      <p className="text-sm text-emerald-600">On time & working</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{stats?.today_present || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">Late Arrivals</p>
                      <p className="text-sm text-amber-600">After grace period</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-600">{stats?.today_late || 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Absent</p>
                      <p className="text-sm text-red-600">No check-in recorded</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{stats?.today_absent || 0}</span>
                </div>

                <Link to="/admin/shifts" className="block mt-4">
                  <Card className="hover:bg-slate-50 transition-colors border-dashed">
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-600">Configure Shifts</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
