import { useState, useEffect } from "react"
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Clock, MapPin, Sunrise, Sunset, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { shiftApi, locationApi, ShiftConfig, Location } from "@/api/admin"
import { DashboardLayout } from "@/components/layout"
import { toast } from "sonner"

function getShiftIcon(startTime: string) {
  const hour = parseInt(startTime.split(":")[0])
  if (hour < 12) return <Sunrise className="w-5 h-5 text-amber-500" />
  if (hour < 18) return <Sunset className="w-5 h-5 text-orange-500" />
  return <Moon className="w-5 h-5 text-indigo-500" />
}

function getShiftColor(startTime: string) {
  const hour = parseInt(startTime.split(":")[0])
  if (hour < 12) return "border-l-amber-400 bg-amber-50"
  if (hour < 18) return "border-l-orange-400 bg-orange-50"
  return "border-l-indigo-400 bg-indigo-50"
}

function formatTimeRange(start: string, end: string) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const h = parseInt(hours)
    const ampm = h >= 12 ? "PM" : "AM"
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  }
  return `${formatTime(start)} - ${formatTime(end)}`
}

function getDuration(start: string, end: string) {
  const [startH, startM] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)
  let duration = (endH * 60 + endM) - (startH * 60 + startM)
  if (duration < 0) duration += 24 * 60
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<ShiftConfig[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftConfig | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    location_id: null as number | null,
    shift_name: "",
    start_time: "09:00",
    end_time: "17:00",
    grace_period_minutes: 15,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [shiftsData, locationsData] = await Promise.all([
        shiftApi.getAll(),
        locationApi.getAll(),
      ])
      setShifts(shiftsData)
      setLocations(locationsData.filter(l => l.is_active))
    } catch (err) {
      setError("Failed to load shifts")
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
      const payload = {
        location_id: formData.location_id || undefined,
        shift_name: formData.shift_name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        grace_period_minutes: formData.grace_period_minutes,
      }

      if (editingShift) {
        await shiftApi.update(editingShift.id, payload)
        toast.success("Shift updated successfully")
      } else {
        await shiftApi.create(payload)
        toast.success("Shift created successfully")
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

  const handleEdit = (shift: ShiftConfig) => {
    setEditingShift(shift)
    setFormData({
      location_id: shift.location_id,
      shift_name: shift.shift_name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      grace_period_minutes: shift.grace_period_minutes,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this shift?")) return

    try {
      await shiftApi.delete(id)
      toast.success("Shift deleted successfully")
      await fetchData()
    } catch (err) {
      toast.error("Failed to delete shift")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingShift(null)
    setFormData({
      location_id: null,
      shift_name: "",
      start_time: "09:00",
      end_time: "17:00",
      grace_period_minutes: 15,
    })
    setError(null)
  }

  const shiftsByLocation = shifts.reduce((acc, shift) => {
    const loc = shift.location_name || "Unassigned"
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(shift)
    return acc
  }, {} as Record<string, ShiftConfig[]>)

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Shifts" },
      ]}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Shift
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Shift Configuration</h1>
          <p className="text-slate-600">Manage work schedules and shift timings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Total Shifts</p>
                  <p className="text-3xl font-bold">{shifts.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Locations</p>
                  <p className="text-3xl font-bold text-indigo-600">{Object.keys(shiftsByLocation).length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Configured</p>
                  <p className="text-3xl font-bold text-emerald-600">{locations.length}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : shifts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No shifts configured</h3>
              <p className="text-slate-600 text-center mb-4 max-w-md">
                Create shift schedules to define work hours for your employees
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Shift
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(shiftsByLocation).map(([locationName, locationShifts]) => (
              <div key={locationName} className="space-y-3">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {locationName} ({locationShifts.length})
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locationShifts.map((shift) => (
                    <Card key={shift.id} className={`border-l-4 hover:shadow-md transition-shadow ${getShiftColor(shift.start_time)}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getShiftIcon(shift.start_time)}
                            <div>
                              <CardTitle className="text-base">{shift.shift_name}</CardTitle>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatTimeRange(shift.start_time, shift.end_time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Duration</span>
                            <span className="font-medium text-slate-700">
                              {getDuration(shift.start_time, shift.end_time)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Grace Period</span>
                            <Badge variant="secondary" className="text-xs">
                              {shift.grace_period_minutes} min
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(shift)} className="h-8 flex-1">
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(shift.id)} className="h-8 flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingShift ? "Edit Shift" : "Add Shift"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shift_name">Shift Name *</Label>
                  <Input
                    id="shift_name"
                    placeholder="e.g., Morning Shift"
                    value={formData.shift_name}
                    onChange={(e) => setFormData({ ...formData, shift_name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <select
                    id="location"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={formData.location_id || ""}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : null })}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select Location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time *</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time *</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grace_period">Grace Period (minutes)</Label>
                  <Input
                    id="grace_period"
                    type="number"
                    min="0"
                    value={formData.grace_period_minutes}
                    onChange={(e) => setFormData({ ...formData, grace_period_minutes: parseInt(e.target.value) || 15 })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-slate-500">Late arrivals within this period won't be marked as late</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingShift ? "Update" : "Create"}
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
