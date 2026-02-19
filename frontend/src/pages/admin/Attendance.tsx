import { useState, useEffect } from "react"
import { Loader2, ChevronLeft, ChevronRight, Download, Search, Filter, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { attendanceApi, locationApi, departmentApi, AttendanceRecord, Location, Department } from "@/api/admin"
import { DashboardLayout } from "@/components/layout"
import { toast } from "sonner"

type DateFilterType = "today" | "week" | "custom"

export default function AttendanceRecordsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("today")
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    start_date: "",
    end_date: "",
    location_id: null as number | null,
    department_id: null as number | null,
  })

  useEffect(() => {
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [page, filters])

  const fetchFilters = async () => {
    try {
      const [locData, deptData] = await Promise.all([
        locationApi.getAll(),
        departmentApi.getAll(),
      ])
      setLocations(locData)
      setDepartments(deptData)
    } catch (err) {
      console.error("Failed to fetch filters:", err)
    }
  }

  const fetchRecords = async () => {
    try {
      setIsLoading(true)
      const params: Record<string, unknown> = {
        page,
        page_size: 20,
      }
      if (filters.date && dateFilterType === "today") params.date = filters.date
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date
      if (filters.location_id) params.location_id = filters.location_id
      if (filters.department_id) params.department_id = filters.department_id

      const data = await attendanceApi.getAll(params)
      setRecords(data.items)
      setTotal(data.total)
    } catch (err) {
      console.error("Failed to fetch attendance:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      setIsExporting(true)
      const blob = await attendanceApi.export({
        format,
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        location_id: filters.location_id || undefined,
        department_id: filters.department_id || undefined,
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `attendance_${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(`Exported to ${format.toUpperCase()} successfully`)
    } catch (err) {
      console.error("Failed to export:", err)
      toast.error("Failed to export attendance")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDateFilterChange = (type: DateFilterType) => {
    setDateFilterType(type)
    const today = new Date().toISOString().split("T")[0]
    
    if (type === "today") {
      setFilters({ ...filters, date: today, start_date: "", end_date: "" })
    } else if (type === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      setFilters({ ...filters, date: "", start_date: weekAgo, end_date: today })
    }
  }

  const clearFilters = () => {
    const today = new Date().toISOString().split("T")[0]
    setFilters({
      date: today,
      start_date: "",
      end_date: "",
      location_id: null,
      department_id: null,
    })
    setSearchQuery("")
    setDateFilterType("today")
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

  const filteredRecords = searchQuery
    ? records.filter(r => 
        r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records

  const totalPages = Math.ceil(total / 20)

  const hasActiveFilters = filters.location_id || filters.department_id || 
    (dateFilterType === "week") || (dateFilterType === "custom" && (filters.start_date || filters.end_date))

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Attendance" },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={isExporting}
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance Records</h1>
          <p className="text-slate-600">Track and manage employee attendance</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search employee or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "bg-indigo-600" : ""}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 w-2 h-2 bg-indigo-500 rounded-full" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={dateFilterType === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateFilterChange("today")}
                  className={dateFilterType === "today" ? "bg-indigo-600" : ""}
                >
                  Today
                </Button>
                <Button
                  variant={dateFilterType === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateFilterChange("week")}
                  className={dateFilterType === "week" ? "bg-indigo-600" : ""}
                >
                  This Week
                </Button>
                <Button
                  variant={dateFilterType === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDateFilterChange("custom")}
                  className={dateFilterType === "custom" ? "bg-indigo-600" : ""}
                >
                  Custom
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {dateFilterType === "custom" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">Start Date</label>
                      <Input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">End Date</label>
                      <Input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="h-9"
                      />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Location</label>
                  <select
                    value={filters.location_id || ""}
                    onChange={(e) => setFilters({ ...filters, location_id: e.target.value ? Number(e.target.value) : null })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Department</label>
                  <select
                    value={filters.department_id || ""}
                    onChange={(e) => setFilters({ ...filters, department_id: e.target.value ? Number(e.target.value) : null })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-slate-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b bg-slate-50">
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Employee</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Check In</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Check Out</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600 text-sm">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(record.date).toLocaleDateString("en-US", { 
                              month: "short", 
                              day: "numeric" 
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                {record.employee_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-sm">{record.employee_name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">{record.location_name}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="text-slate-900">{new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {record.check_out_time 
                              ? new Date(record.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(record.status, record.is_late)}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {record.is_late && (
                              <span className="text-amber-600 font-medium">
                                +{record.late_by_minutes} min late
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredRecords.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium">No attendance records found</p>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or date range</p>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-600">
                      Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} records
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "ghost"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className={page === pageNum ? "bg-indigo-600" : ""}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
