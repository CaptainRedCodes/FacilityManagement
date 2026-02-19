import { useState, useEffect, useCallback } from "react"
import { useAuth, getUserDisplayName } from "@/contexts/AuthContext"
import { attendanceApi, AttendanceRecord } from "@/api/attendance"
import { CheckInButton } from "@/components/CheckInButton"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCard } from "@/components/ui/stats-card"
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
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Clock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Target,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout"

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null)
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const fetchData = useCallback(async () => {
    try {
      const [today, historyData] = await Promise.all([
        attendanceApi.getTodayAttendance(),
        attendanceApi.getHistory(),
      ])
      setTodayAttendance(today)
      setHistory(historyData)
    } catch (error) {
      console.error("Failed to fetch attendance data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleCheckInSuccess = (attendance: AttendanceRecord | null) => {
    if (attendance) {
      setTodayAttendance(attendance)
      fetchData()
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    try {
      const result = await attendanceApi.checkout()
      setTodayAttendance(result)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getWorkingDuration = () => {
    if (!todayAttendance?.check_in_time) return "0 hrs 0 mins"
    const checkIn = new Date(todayAttendance.check_in_time)
    const checkOut = todayAttendance.check_out_time
      ? new Date(todayAttendance.check_out_time)
      : currentTime
    const diff = checkOut.getTime() - checkIn.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} hrs ${minutes} mins`
  }

  const getStatusBadge = (attendance: AttendanceRecord) => {
    if (attendance.status === "checked_out") {
      return <Badge variant="info">Checked Out</Badge>
    }
    if (attendance.is_late) {
      return <Badge variant="warning">Late</Badge>
    }
    return <Badge variant="success">Present</Badge>
  }

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { weekday: "short" })
  }

  const getMonthDays = () => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(`${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`)
    }
    return days
  }

  const getAttendanceForDate = (dateStr: string) => {
    return history.find((a) => a.date === dateStr)
  }

  const getMonthStats = () => {
    const monthDays = getMonthDays()
    const present = history.filter(
      (a) => a.date.startsWith(selectedMonth) && a.status === "present"
    ).length
    const late = history.filter(
      (a) => a.date.startsWith(selectedMonth) && a.is_late
    ).length
    const checkedOut = history.filter(
      (a) => a.date.startsWith(selectedMonth) && a.status === "checked_out"
    ).length
    const absent = monthDays.length - present - checkedOut

    return { present, late, checkedOut, absent }
  }

  const stats = getMonthStats()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  const isCheckedIn = todayAttendance !== null && todayAttendance.status === "present"
  const isCheckedOut = todayAttendance?.status === "checked_out"

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "My Dashboard" },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Welcome back, {user?.name}!</h1>
          <p className="text-slate-600 mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <Card className="shadow-lg border-indigo-100">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <p className="text-4xl font-bold text-slate-800">{formatTime(currentTime)}</p>
              <p className="text-slate-500 mt-1">Your assigned location: <strong>{getUserDisplayName(user?.location ?? null)}</strong></p>
            </div>

            {!isCheckedIn && !isCheckedOut && (
              <div className="text-center space-y-4">
                <CheckInButton onSuccess={handleCheckInSuccess} />
                <p className="text-sm text-slate-500">Tap the button above to check in</p>
              </div>
            )}

            {isCheckedIn && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xl font-semibold">You're checked in</span>
                </div>

                {todayAttendance?.is_late && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800">
                    <AlertCircle className="w-4 h-4 inline mr-2" />
                    You checked in {todayAttendance.late_by_minutes} minutes late
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Check-in Time</p>
                    <p className="text-xl font-semibold text-slate-800">
                      {formatDateTime(todayAttendance?.check_in_time || "")}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Working Duration</p>
                    <p className="text-xl font-semibold text-slate-800">{getWorkingDuration()}</p>
                  </div>
                </div>

                {todayAttendance?.distance_from_location_meters && (
                  <p className="text-xs text-slate-500">
                    Verified {Math.round(todayAttendance.distance_from_location_meters)}m from workplace
                  </p>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full max-w-sm">
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
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCheckOut}
                        disabled={isCheckingOut}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isCheckingOut ? "Checking out..." : "Confirm Check Out"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {isCheckedOut && (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="text-xl font-semibold">Great work today!</span>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm mx-auto">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Checked in</p>
                      <p className="font-semibold text-slate-800">
                        {formatDateTime(todayAttendance?.check_in_time || "")}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Checked out</p>
                      <p className="font-semibold text-slate-800">
                        {formatDateTime(todayAttendance?.check_out_time || "")}
                      </p>
                    </div>
                  </div>
                </div>

                {todayAttendance?.is_late && (
                  <Badge variant="warning">
                    Late by {todayAttendance.late_by_minutes} minutes
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Present"
            value={stats.present}
            icon={CheckCircle2}
            variant="success"
          />
          <StatsCard
            title="Late"
            value={stats.late}
            icon={AlertCircle}
            variant="warning"
          />
          <StatsCard
            title="Checked Out"
            value={stats.checkedOut}
            icon={Clock}
            variant="info"
          />
          <StatsCard
            title="Absent"
            value={stats.absent}
            icon={Target}
            variant="danger"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Attendance History
            </CardTitle>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm bg-white"
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Day</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Check In</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Check Out</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Hours</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getMonthDays().map((day) => {
                    const attendance = getAttendanceForDate(day)
                    return (
                      <tr key={day} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">{formatDate(day)}</td>
                        <td className="py-3 px-4">{getDayName(day)}</td>
                        <td className="py-3 px-4">
                          {attendance ? formatDateTime(attendance.check_in_time) : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {attendance?.check_out_time
                            ? formatDateTime(attendance.check_out_time)
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {attendance?.check_in_time && attendance?.check_out_time
                            ? (() => {
                                const checkIn = new Date(attendance.check_in_time)
                                const checkOut = new Date(attendance.check_out_time)
                                const diff = checkOut.getTime() - checkIn.getTime()
                                const hours = Math.floor(diff / (1000 * 60 * 60))
                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                                return `${hours}h ${minutes}m`
                              })()
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          {attendance ? getStatusBadge(attendance) : <Badge variant="destructive">Absent</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
