import { useState, useEffect } from "react"
import { Loader2, TrendingUp, Users, MapPin, Building, Clock, AlertCircle, Activity, Calendar, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { DashboardLayout } from "@/components/layout"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts"

const COLORS = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444",
  checkedOut: "#6b7280"
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lateFrequency, setLateFrequency] = useState<LateFrequencyItem[]>([])
  const [absentTrends, setAbsentTrends] = useState<AbsentTrendItem[]>([])
  const [locationAttendance, setLocationAttendance] = useState<LocationAttendanceItem[]>([])
  const [departmentAttendance, setDepartmentAttendance] = useState<DepartmentAttendanceItem[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeView, setActiveView] = useState<"overview" | "trends" | "departments" | "locations">("overview")

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
    ? Math.round(((stats?.today_present || 0) / totalEmployees) * 100) 
    : 0

  const todayData = [
    { name: "Present", value: stats?.today_present || 0, color: COLORS.present },
    { name: "Late", value: stats?.today_late || 0, color: COLORS.late },
    { name: "Absent", value: stats?.today_absent || 0, color: COLORS.absent },
    { name: "Checked Out", value: stats?.today_checked_out || 0, color: COLORS.checkedOut },
  ].filter(d => d.value > 0)

  const trendData = absentTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString("en-US", { weekday: "short" }),
    present: trend.present,
    absent: trend.absent,
    total: trend.present + trend.absent,
    rate: Math.round((trend.present / (trend.present + trend.absent)) * 100) || 0
  })).reverse()

  const topLateEmployees = lateFrequency
    .sort((a, b) => b.late_percentage - a.late_percentage)
    .slice(0, 5)

  if (isLoading) {
    return (
      <DashboardLayout
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Analytics" },
        ]}
      >
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Analytics" },
      ]}
      actions={
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={selectedLocation || ""}
          onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-600">Track attendance trends and performance metrics</p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "trends", label: "Trends", icon: TrendingUp },
            { id: "departments", label: "Departments", icon: Building },
            { id: "locations", label: "Locations", icon: MapPin },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeView === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={activeView === tab.id ? "bg-indigo-600" : "text-slate-600"}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {activeView === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Attendance Rate</p>
                      <p className="text-3xl font-bold">{attendanceRate}%</p>
                    </div>
                    <Target className="w-8 h-8 text-white/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm">Present Today</p>
                      <p className="text-3xl font-bold text-emerald-600">{stats?.today_present || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm">Late Arrivals</p>
                      <p className="text-3xl font-bold text-amber-600">{stats?.today_late || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm">Absent</p>
                      <p className="text-3xl font-bold text-red-600">{stats?.today_absent || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Today's Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayData.length > 0 ? (
                    <div className="flex items-center gap-8">
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={todayData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {todayData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {todayData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No attendance data for today
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    7-Day Attendance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="present" 
                            stroke={COLORS.present} 
                            strokeWidth={2}
                            dot={{ fill: COLORS.present, strokeWidth: 2 }}
                            name="Present"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="absent" 
                            stroke={COLORS.absent} 
                            strokeWidth={2}
                            dot={{ fill: COLORS.absent, strokeWidth: 2 }}
                            name="Absent"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No trend data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {topLateEmployees.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Top Late Arrivals This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topLateEmployees.map((emp, index) => (
                      <div key={emp.employee_id} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{emp.employee_name}</p>
                          <p className="text-sm text-slate-500">
                            {emp.late_days} of {emp.total_days} days late
                          </p>
                        </div>
                        <div className="w-32">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-slate-600">{emp.late_percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${emp.late_percentage > 30 ? "bg-red-500" : emp.late_percentage > 10 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(emp.late_percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeView === "trends" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="present" name="Present" fill={COLORS.present} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="absent" name="Absent" fill={COLORS.absent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Rate by Day</CardTitle>
                </CardHeader>
                <CardContent>
                  {trendData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ borderRadius: 8 }}
                            formatter={(value) => [`${value}%`, 'Attendance Rate']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rate" 
                            stroke="#8b5cf6" 
                            strokeWidth={3}
                            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                            name="Attendance Rate %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">No data</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Late Frequency Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {lateFrequency.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {lateFrequency.slice(0, 10).map((emp) => (
                        <div key={emp.employee_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                          <span className="font-medium text-sm">{emp.employee_name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full">
                              <div 
                                className={`h-full rounded-full ${emp.late_percentage > 30 ? "bg-red-500" : emp.late_percentage > 10 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${emp.late_percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600 w-16 text-right">
                              {emp.late_percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">No late data</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === "departments" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {departmentAttendance.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={departmentAttendance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <YAxis dataKey="department_name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="present" name="Present" fill={COLORS.present} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="late" name="Late" fill={COLORS.late} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="absent" name="Absent" fill={COLORS.absent} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    No department data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Employees</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Present</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Late</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Absent</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departmentAttendance.map((dept) => (
                        <tr key={dept.department_id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{dept.department_name}</td>
                          <td className="py-3 px-4">{dept.total_employees}</td>
                          <td className="py-3 px-4 text-emerald-600 font-medium">{dept.present}</td>
                          <td className="py-3 px-4 text-amber-600">{dept.late}</td>
                          <td className="py-3 px-4 text-red-600">{dept.absent}</td>
                          <td className="py-3 px-4">
                            <Badge variant={dept.attendance_rate >= 90 ? "success" : dept.attendance_rate >= 70 ? "warning" : "destructive"}>
                              {dept.attendance_rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === "locations" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Location</CardTitle>
              </CardHeader>
              <CardContent>
                {locationAttendance.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationAttendance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <YAxis dataKey="location_name" type="category" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="present" name="Present" fill={COLORS.present} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="late" name="Late" fill={COLORS.late} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="absent" name="Absent" fill={COLORS.absent} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    No location data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Employees</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Present</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Late</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Absent</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationAttendance.map((loc) => (
                        <tr key={loc.location_id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium">{loc.location_name}</td>
                          <td className="py-3 px-4">{loc.total_employees}</td>
                          <td className="py-3 px-4 text-emerald-600 font-medium">{loc.present}</td>
                          <td className="py-3 px-4 text-amber-600">{loc.late}</td>
                          <td className="py-3 px-4 text-red-600">{loc.absent}</td>
                          <td className="py-3 px-4">
                            <Badge variant={loc.attendance_rate >= 90 ? "success" : loc.attendance_rate >= 70 ? "warning" : "destructive"}>
                              {loc.attendance_rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
