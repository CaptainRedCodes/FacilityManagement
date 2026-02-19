import { useState, useEffect } from "react"
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { departmentApi, Department } from "@/api/admin"
import { DashboardLayout } from "@/components/layout"
import { toast } from "sonner"

const departmentColors = [
  "bg-blue-500",
  "bg-purple-500", 
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
]

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setIsLoading(true)
      const data = await departmentApi.getAll()
      setDepartments(data)
    } catch (err) {
      setError("Failed to load departments")
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
        name: formData.name,
        description: formData.description || null,
      }

      if (editingDepartment) {
        await departmentApi.update(editingDepartment.id, payload)
        toast.success("Department updated successfully")
      } else {
        await departmentApi.create(payload)
        toast.success("Department created successfully")
      }
      await fetchDepartments()
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

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    setFormData({
      name: department.name,
      description: department.description || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return

    try {
      await departmentApi.delete(id)
      toast.success("Department deleted successfully")
      await fetchDepartments()
    } catch (err) {
      toast.error("Failed to delete department")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingDepartment(null)
    setFormData({
      name: "",
      description: "",
    })
    setError(null)
  }

  const activeDepartments = departments.filter(d => d.is_active)
  const inactiveDepartments = departments.filter(d => !d.is_active)

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Departments" },
      ]}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-600">Organize your team into departments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">Total Departments</p>
                  <p className="text-3xl font-bold">{departments.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm">Active</p>
                  <p className="text-3xl font-bold text-emerald-600">{activeDepartments.length}</p>
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
                  <p className="text-slate-500 text-sm">Inactive</p>
                  <p className="text-3xl font-bold text-slate-400">{inactiveDepartments.length}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-slate-400" />
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
        ) : departments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No departments yet</h3>
              <p className="text-slate-600 text-center mb-4 max-w-md">
                Create departments to organize your employees and track attendance by team
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeDepartments.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active ({activeDepartments.length})</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeDepartments.map((department, index) => (
                    <Card key={department.id} className="hover:shadow-md transition-shadow group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${departmentColors[index % departmentColors.length]} text-white`}>
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{department.name}</CardTitle>
                              <Badge variant="success" className="text-xs mt-1">Active</Badge>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(department)} className="h-8 w-8 p-0">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(department.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {department.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">{department.description}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {inactiveDepartments.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Inactive ({inactiveDepartments.length})</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveDepartments.map((department) => (
                    <Card key={department.id} className="opacity-60 hover:opacity-100 transition-opacity group border-dashed">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-200 text-slate-500">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base text-slate-700">{department.name}</CardTitle>
                              <Badge variant="secondary" className="text-xs mt-1">Inactive</Badge>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(department)} className="h-8 w-8 p-0">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(department.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingDepartment ? "Edit Department" : "Add Department"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="Brief description of the department"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingDepartment ? "Update" : "Create"}
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
