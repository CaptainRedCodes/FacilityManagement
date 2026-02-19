import { api } from "@/lib/api"

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
  distance_from_location_meters: number | null
}

export interface CheckInRequest {
  latitude: number
  longitude: number
}

export interface CheckInResponse extends AttendanceRecord {
  message: string
}

export const attendanceApi = {
  checkin: async (coords: CheckInRequest): Promise<CheckInResponse> => {
    const response = await api.post<CheckInResponse>("/attendance/checkin", coords)
    return response.data
  },

  checkout: async (): Promise<AttendanceRecord> => {
    const response = await api.post<AttendanceRecord>("/attendance/checkout")
    return response.data
  },

  getTodayAttendance: async (): Promise<AttendanceRecord | null> => {
    const response = await api.get<AttendanceRecord | null>("/attendance/today")
    return response.data
  },

  getHistory: async (
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams()
    if (startDate) params.append("start_date", startDate)
    if (endDate) params.append("end_date", endDate)
    const response = await api.get<AttendanceRecord[]>(
      `/attendance/history?${params.toString()}`
    )
    return response.data
  },

  getAllAttendance: async (params?: {
    date?: string
    location_id?: number
    department_id?: number
    employee_id?: number
    page?: number
    page_size?: number
  }): Promise<{
    items: AttendanceRecord[]
    total: number
    page: number
    page_size: number
  }> => {
    const response = await api.get("/attendance/all", { params })
    return response.data
  },
}
