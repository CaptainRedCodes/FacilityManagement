import { useState, useEffect } from "react"
import { Building2, Loader2, TrendingUp, Users, MapPin, Building, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  analyticsApi,
  locationApi,
  DashboardStats,
  LateFrequencyItem,
  AbsentTrendItem,
  LocationAttendanceItem,
  DepartmentAttendanceItem,
  Location,
} from "@/api/admin"

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lateFrequency, setLateFrequency] = useState<LateFrequencyItem[]>([])
  const [absentTrends, setAbsentTrends] = useState<AbsentTrendItem[]>([])
  const [locationAttendance, setLocationAttendance] = useState<LocationAttendanceItem[]>([])
  const [departmentAttendance, setDepartmentAttendance] = useState<DepartmentAttendanceItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedLocation])

  const fetchFilters = async () => {
    try {
      const locData = await locationApi.getAll()
      setLocations(locData.filter(l => l.is_active))
    } catch (err) {
      console.error("Failed to fetch filters:", err)
    }
  }

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const params = selectedLocation ? { location_id: selectedLocation } : {}
      
      const [summaryData, lateData, trendsData, locData, deptData] = await Promise.all([
        analyticsApi.getSummary(params),
        analyticsApi.getLateFrequency(params),
        analyticsApi.getAbsentTrends({ days: 7, ...params }),
        analyticsApi.getByLocation(),
        analyticsApi.getByDepartment(),
      ])
      
      setStats(summaryData)
      setLateFrequency(lateData)
      setAbsentTrends(trendsData)
      setLocationAttendance(locData)
      setDepartmentAttendance(deptData)
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalEmployees = stats?.total_employees || 0
  const attendanceRate = totalEmployees > 0 
    ? Math.round((stats?.today_present || 0) / totalEmployees * 100) 
    : 0

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
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
            <select
              className="border rounded px-3 py-2 text-sm"
              value={selectedLocation || ""}
              onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Track attendance trends and performance metrics</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total_employees || 0}</p>
                  <p className="text-sm text-slate-600">Total Employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{attendanceRate}%</p>
                  <p className="text-sm text-slate-600">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.today_present || 0}</p>
                  <p className="text-sm text-slate-600">Present Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.today_late || 0}</p>
                  <p className="text-sm text-slate-600">Late Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.today_absent || 0}</p>
                  <p className="text-sm text-slate-600">Absent Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Absent Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {absentTrends.length === 0 ? (
                <p className="text-slate-500 text-sm">No data available</p>
              ) : (
                <div className="space-y-3">
                  {absentTrends.map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">
                        {new Date(trend.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(trend.present / (trend.present + trend.absent)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">
                          {trend.present} present
                        </span>
                        {trend.absent > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {trend.absent} absent
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Late Frequency (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {lateFrequency.length === 0 ? (
                <p className="text-slate-500 text-sm">No data available</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {lateFrequency
                    .sort((a, b) => b.late_percentage - a.late_percentage)
                    .slice(0, 10)
                    .map((item) => (
                      <div key={item.employee_id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.employee_name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.late_percentage > 30 ? "bg-red-500" : item.late_percentage > 10 ? "bg-amber-500" : "bg-green-500"}`}
                              style={{ width: `${item.late_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-slate-600 w-20 text-right">
                            {item.late_days}/{item.total_days} days
                          </span>
                          {item.late_percentage > 10 && (
                            <Badge variant={item.late_percentage > 30 ? "destructive" : "warning"} className="text-xs">
                              {item.late_percentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Attendance by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {locationAttendance.length === 0 ? (
                <p className="text-slate-500 text-sm">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Location</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Employees</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Present</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Late</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationAttendance.map((loc) => (
                        <tr key={loc.location_id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium">{loc.location_name}</td>
                          <td className="py-2 px-3">{loc.total_employees}</td>
                          <td className="py-2 px-3">{loc.present}</td>
                          <td className="py-2 px-3">
                            {loc.late > 0 && <span className="text-amber-600">{loc.late}</span>}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant={loc.attendance_rate >= 90 ? "success" : loc.attendance_rate >= 70 ? "warning" : "destructive"}>
                              {loc.attendance_rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Attendance by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departmentAttendance.length === 0 ? (
                <p className="text-slate-500 text-sm">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Department</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Employees</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Present</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Late</th>
                        <th className="text-left py-2 px-3 font-medium text-slate-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentAttendance.map((dept) => (
                        <tr key={dept.department_id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium">{dept.department_name}</td>
                          <td className="py-2 px-3">{dept.total_employees}</td>
                          <td className="py-2 px-3">{dept.present}</td>
                          <td className="py-2 px-3">
                            {dept.late > 0 && <span className="text-amber-600">{dept.late}</span>}
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant={dept.attendance_rate >= 90 ? "success" : dept.attendance_rate >= 70 ? "warning" : "destructive"}>
                              {dept.attendance_rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
