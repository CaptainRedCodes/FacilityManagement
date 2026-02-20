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
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
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
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
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

  const handleNavClick = () => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-200 flex flex-col",
        collapsed ? "lg:w-16" : "lg:w-56",
        mobileOpen ? "w-56 translate-x-0" : "w-56 -translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-900">WorkSight</span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-8 w-8 p-0 hidden lg:flex text-gray-400 hover:text-gray-900 hover:bg-gray-100"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
          {mobileOpen && onMobileClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileClose}
              className="h-8 w-8 p-0 lg:hidden text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive && "text-gray-900")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2.5 border-t border-gray-100">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer text-sm",
            collapsed && "lg:justify-center px-0"
          )}
        >
          <LogOut className="w-4.5 h-4.5" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  )
}
