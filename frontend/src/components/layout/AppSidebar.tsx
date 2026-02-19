import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Building2,
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  Building,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles?: string[]
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: Calendar },
  { label: "Locations", href: "/admin/locations", icon: MapPin },
  { label: "Departments", href: "/admin/departments", icon: Building },
  { label: "Shifts", href: "/admin/shifts", icon: Clock },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
]

const supervisorNavItems: NavItem[] = [
  { label: "My Team", href: "/dashboard/supervisor", icon: LayoutDashboard },
  { label: "Attendance", href: "/admin/attendance", icon: Calendar },
]

const employeeNavItems: NavItem[] = [
  { label: "My Dashboard", href: "/dashboard/employee", icon: LayoutDashboard },
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const getNavItems = () => {
    switch (user?.role) {
      case "Admin":
        return adminNavItems
      case "Supervisor":
        return supervisorNavItems
      case "Employee":
        return employeeNavItems
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white border-r transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-slate-900">WorkSight</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-indigo-600")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  )
}
