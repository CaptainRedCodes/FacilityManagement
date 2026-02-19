import { useState, ReactNode } from "react"
import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"
import { PageContainer } from "./PageContainer"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface DashboardLayoutProps {
  children: ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function DashboardLayout({ children, breadcrumbs, actions }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className={`${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"} transition-all duration-300`}>
        <AppHeader 
          breadcrumbs={breadcrumbs} 
          actions={actions}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  )
}
