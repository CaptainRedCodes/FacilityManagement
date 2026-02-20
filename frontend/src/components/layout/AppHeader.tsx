import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home, Menu } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  onMenuClick?: () => void
}

export function AppHeader({ breadcrumbs, onMenuClick}: AppHeaderProps) {
  const { user } = useAuth()
  const location = useLocation()

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const paths = location.pathname.split("/").filter(Boolean)
    const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }]

    if (paths[0] === "dashboard") {
      items.push({ label: "Dashboard" })
      if (paths[1] === "supervisor") {
        items.push({ label: "My Team" })
      } else if (paths[1] === "employee") {
        items.push({ label: "My Dashboard" })
      }
    } else if (paths[0] === "admin") {
      items.push({ label: "Dashboard", href: "/dashboard" })
      const adminLabels: Record<string, string> = {
        users: "Users",
        attendance: "Attendance",
        locations: "Locations",
        departments: "Departments",
        shifts: "Shifts",
        analytics: "Analytics",
      }
      if (paths[1] && adminLabels[paths[1]]) {
        items.push({ label: adminLabels[paths[1]] })
      }
    }

    return breadcrumbs || items
  }

  const finalBreadcrumbs = breadcrumbs || generateBreadcrumbs()

  return (
    <header className="h-14 bg-white border-b border-gray-100 px-5 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden h-8 w-8 p-0 text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
        >
          <Menu className="w-4.5 h-4.5" />
        </Button>
        <nav className="flex items-center gap-1 text-sm">
          {finalBreadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  {index === 0 ? <Home className="w-3.5 h-3.5" /> : item.label}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium text-xs">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
