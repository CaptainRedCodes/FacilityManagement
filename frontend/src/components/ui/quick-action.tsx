import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionProps {
  icon: LucideIcon
  label: string
  description?: string
  onClick?: () => void
  variant?: "default" | "primary"
}

export function QuickAction({ icon: Icon, label, description, onClick, variant = "default" }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all hover:shadow-md",
        variant === "primary"
          ? "bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700"
          : "bg-white border-slate-200 hover:border-indigo-200"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
        variant === "primary" ? "bg-white/20" : "bg-indigo-50"
      )}>
        <Icon className={cn("w-5 h-5", variant === "primary" ? "text-white" : "text-indigo-600")} />
      </div>
      <p className={cn(
        "font-medium",
        variant === "primary" ? "text-white" : "text-slate-900"
      )}>
        {label}
      </p>
      {description && (
        <p className={cn(
          "text-sm mt-1",
          variant === "primary" ? "text-indigo-100" : "text-slate-500"
        )}>
          {description}
        </p>
      )}
    </button>
  )
}
