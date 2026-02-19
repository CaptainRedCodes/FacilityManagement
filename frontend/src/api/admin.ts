import { api } from "@/lib/api"

export interface DashboardStats {
  total_employees: number
  total_supervisors: number
  total_locations: number
  today_present: number
  today_absent: number
  today_late: number
  today_checked_out: number
}

export interface AttendanceRecord {
  id: number
  employee_id: number
  employee_name: string
  location_id: number
  location_name: string
  check_in_time: string
  check_out_time: string | null
  is_late: boolean
  late_by_minutes: number
  status: string
  date: string
}

export interface Location {
  id: number
  name: string
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  allowed_radius_meters: number
  is_active: boolean
  created_at: string
}

export interface Department {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface ShiftConfig {
  id: number
  location_id: number
  location_name: string
  shift_name: string
  start_time: string
  end_time: string
  grace_period_minutes: number
  created_at: string
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/attendance/analytics/summary")
    return response.data
  },

  getTodayAttendance: async (params?: {
    location_id?: number
    department_id?: number
  }): Promise<AttendanceRecord[]> => {
    const today = new Date().toISOString().split("T")[0]
    const response = await api.get("/attendance/all", {
      params: { date: today, ...params, page_size: 1000 },
    })
    return response.data.items
  },
}

export const locationApi = {
  getAll: async (): Promise<Location[]> => {
    const response = await api.get("/locations")
    return response.data
  },

  create: async (data: Partial<Location>): Promise<Location> => {
    const response = await api.post("/locations", data)
    return response.data
  },

  update: async (id: number, data: Partial<Location>): Promise<Location> => {
    const response = await api.put(`/locations/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/locations/${id}`)
  },
}

export const departmentApi = {
  getAll: async (): Promise<Department[]> => {
    const response = await api.get("/departments")
    return response.data
  },

  create: async (data: Partial<Department>): Promise<Department> => {
    const response = await api.post("/departments", data)
    return response.data
  },

  update: async (id: number, data: Partial<Department>): Promise<Department> => {
    const response = await api.put(`/departments/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}`)
  },
}

export const shiftApi = {
  getAll: async (): Promise<ShiftConfig[]> => {
    const response = await api.get("/shifts")
    return response.data
  },

  create: async (data: Partial<ShiftConfig>): Promise<ShiftConfig> => {
    const response = await api.post("/shifts", data)
    return response.data
  },

  update: async (id: number, data: Partial<ShiftConfig>): Promise<ShiftConfig> => {
    const response = await api.put(`/shifts/${id}`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/shifts/${id}`)
  },
}

export const attendanceApi = {
  getAll: async (params?: {
    date?: string
    start_date?: string
    end_date?: string
    location_id?: number
    department_id?: number
    employee_id?: number
    page?: number
    page_size?: number
  }): Promise<{ items: AttendanceRecord[]; total: number; page: number; page_size: number }> => {
    const response = await api.get("/attendance/all", { params })
    return response.data
  },

  export: async (params: {
    format: "excel" | "pdf"
    start_date?: string
    end_date?: string
    location_id?: number
    department_id?: number
  }): Promise<Blob> => {
    const response = await api.get("/attendance/export", {
      params,
      responseType: "blob",
    })
    return response.data
  },
}

export interface LateFrequencyItem {
  employee_id: number
  employee_name: string
  total_days: number
  late_days: number
  late_percentage: number
}

export interface AbsentTrendItem {
  date: string
  present: number
  absent: number
}

export interface LocationAttendanceItem {
  location_id: number
  location_name: string
  total_employees: number
  present: number
  absent: number
  late: number
  attendance_rate: number
}

export interface DepartmentAttendanceItem {
  department_id: number
  department_name: string
  total_employees: number
  present: number
  absent: number
  late: number
  attendance_rate: number
}

export const analyticsApi = {
  getSummary: async (params?: { date?: string; location_id?: number }): Promise<DashboardStats> => {
    const response = await api.get("/attendance/analytics/summary", { params })
    return response.data
  },

  getLateFrequency: async (params?: {
    start_date?: string
    end_date?: string
    location_id?: number
  }): Promise<LateFrequencyItem[]> => {
    const response = await api.get("/attendance/analytics/late-frequency", { params })
    return response.data
  },

  getAbsentTrends: async (params?: { days?: number; location_id?: number }): Promise<AbsentTrendItem[]> => {
    const response = await api.get("/attendance/analytics/absent-trends", { params })
    return response.data
  },

  getByLocation: async (params?: { date?: string }): Promise<LocationAttendanceItem[]> => {
    const response = await api.get("/attendance/analytics/by-location", { params })
    return response.data
  },

  getByDepartment: async (params?: { date?: string }): Promise<DepartmentAttendanceItem[]> => {
    const response = await api.get("/attendance/analytics/by-department", { params })
    return response.data
  },
}
