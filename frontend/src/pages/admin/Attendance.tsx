import { useState, useEffect } from "react"
import { Building2, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { attendanceApi, locationApi, departmentApi, AttendanceRecord, Location, Department } from "@/api/admin"
import { toast } from "sonner"

export default function AttendanceRecordsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
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
      if (filters.date) params.date = filters.date
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

  const getStatusBadge = (status: string, isLate: boolean) => {
    if (status === "checked_out") {
      return <Badge variant="info">Checked Out</Badge>
    }
    if (isLate) {
      return <Badge variant="warning">Late</Badge>
    }
    return <Badge variant="success">Present</Badge>
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">WorkSight</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Attendance Records</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="border rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Location</label>
                <select
                  value={filters.location_id || ""}
                  onChange={(e) => setFilters({ ...filters, location_id: e.target.value ? Number(e.target.value) : null })}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Department</label>
                <select
                  value={filters.department_id || ""}
                  onChange={(e) => setFilters({ ...filters, department_id: e.target.value ? Number(e.target.value) : null })}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({
                    date: new Date().toISOString().split("T")[0],
                    start_date: "",
                    end_date: "",
                    location_id: null,
                    department_id: null,
                  })}
                >
                  Clear Filters
                </Button>
              </div>
              <div className="flex items-end gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => handleExport("excel")}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport("pdf")}
                  disabled={isExporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Location</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Check In</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Check Out</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-600">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium">{record.employee_name}</td>
                          <td className="py-3 px-4 text-slate-600">{record.location_name}</td>
                          <td className="py-3 px-4">
                            {new Date(record.check_in_time).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-4">
                            {record.check_out_time 
                              ? new Date(record.check_out_time).toLocaleTimeString() 
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(record.status, record.is_late)}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {record.is_late && (
                              <span className="text-amber-600">Late by {record.late_by_minutes} mins</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {records.length === 0 && (
                  <div className="text-center py-8 text-slate-500">No attendance records found</div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
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
      </main>
    </div>
  )
}
