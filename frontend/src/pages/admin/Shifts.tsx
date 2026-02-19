import { useState, useEffect } from "react"
import { Building2, Plus, Loader2, AlertCircle, Pencil, Trash2, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { shiftApi, locationApi, ShiftConfig, Location } from "@/api/admin"
import { toast } from "sonner"

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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Shift Configuration</h1>
          <Button onClick={() => setIsModalOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Shift
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

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((shift) => (
              <Card key={shift.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{shift.shift_name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(shift)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(shift.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{shift.start_time} - {shift.end_time}</span>
                    </div>
                    <p className="text-slate-600">Location: {shift.location_name}</p>
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary">Grace: {shift.grace_period_minutes} min</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {shifts.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-500">
                No shifts found. Add your first shift configuration.
              </div>
            )}
          </div>
        )}
      </main>

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
                    className="border rounded px-3 py-2 w-full"
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
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingShift ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
