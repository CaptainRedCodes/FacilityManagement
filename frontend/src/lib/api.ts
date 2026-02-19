import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
      return Promise.reject(error)
    }
    return Promise.reject(error)
  }
)

export default api
