import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api } from "@/lib/api"

export type UserRole = "Admin" | "Supervisor" | "Employee"
export type UserStatus = "Active" | "Inactive"

interface LocationName {
  id: number
  name: string
}

interface DepartmentName {
  id: number
  name: string
}

interface SupervisorName {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  location: string | LocationName | null
  department: string | DepartmentName | null
  supervisor: string | SupervisorName | null
  status: UserStatus
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

export function getUserDisplayName(field: User["location"]): string {
  if (!field) return "Not assigned"
  if (typeof field === "string") return field || "Not assigned"
  return field.name || "Not assigned"
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        try {
          const response = await api.get("/auth/me")
          setUser(response.data)
          setToken(storedToken)
        } catch {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        }
      }
      setIsLoading(false)
    }

    validateToken()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    })
    const { access_token, user: userData } = response.data
    setToken(access_token)
    setUser(userData)
    localStorage.setItem("token", access_token)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
