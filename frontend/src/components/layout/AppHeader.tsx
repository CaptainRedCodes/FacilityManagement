import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
}

export function AppHeader({ breadcrumbs}: AppHeaderProps) {
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
    <header className="h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <nav className="flex items-center gap-1 text-sm">
          {finalBreadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
              {item.href ? (
                <Link
                  to={item.href}
                  className="text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {index === 0 ? <Home className="w-4 h-4" /> : item.label}
                </Link>
              ) : (
                <span className="text-slate-900 font-medium">{item.label}</span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
