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

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      <div className={`${sidebarCollapsed ? "ml-16" : "ml-64"} transition-all duration-300`}>
        <AppHeader 
          breadcrumbs={breadcrumbs} 
          actions={actions} 
        />
        <PageContainer>
          {children}
        </PageContainer>
      </div>
    </div>
  )
}
