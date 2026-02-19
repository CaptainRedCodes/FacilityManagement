import { useState } from "react"
import axios from "axios"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { GPSPermissionBanner } from "@/components/GPSPermissionBanner"
import { useGPS } from "@/hooks/useGPS"
import { attendanceApi, AttendanceRecord } from "@/api/attendance"

type CheckInState =
  | "IDLE"
  | "GETTING_LOCATION"
  | "VALIDATING"
  | "GPS_DENIED"
  | "OUTSIDE_RADIUS"
  | "ALREADY_CHECKED_IN"
  | "ERROR"

interface CheckInButtonProps {
  onSuccess: (attendance: AttendanceRecord) => void
  alreadyCheckedIn?: boolean
}

export function CheckInButton({ onSuccess, alreadyCheckedIn }: CheckInButtonProps) {
  const [state, setState] = useState<CheckInState>(
    alreadyCheckedIn ? "ALREADY_CHECKED_IN" : "IDLE"
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { getLocation, isLoading: isGettingLocation } = useGPS()

  const handleCheckIn = async () => {
    if (alreadyCheckedIn) {
      return
    }

    setState("GETTING_LOCATION")
    setErrorMessage(null)

    try {
      const coords = await getLocation()
      setState("VALIDATING")

      const response = await attendanceApi.checkin(coords)
      
      toast.success(response.message)
      onSuccess(response)
      setState("IDLE")
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const detail = error.response?.data?.detail

        if (status === 400) {
          if (detail?.includes("not at your assigned")) {
            const match = detail.match(/(\d+)m away/)
            const distance = match ? match[1] : "unknown"
            setErrorMessage(`You are ${distance}m away from your workplace. Move closer and try again.`)
            setState("OUTSIDE_RADIUS")
          } else if (detail?.includes("Already checked in")) {
            setState("ALREADY_CHECKED_IN")
            toast.info("You have already checked in today")
            onSuccess(null as unknown as AttendanceRecord)
          } else {
            setState("IDLE")
            toast.error(detail || "Check-in failed")
          }
        } else {
          setState("IDLE")
          toast.error(detail || "Check-in failed. Please try again.")
        }
      } else if (error instanceof Error) {
        if (error.message === "Location access denied") {
          setState("GPS_DENIED")
        } else {
          setState("IDLE")
          toast.error(error.message || "Failed to get location")
        }
      } else {
        setState("IDLE")
        toast.error("An unexpected error occurred")
      }
    }
  }

  const handleRetry = () => {
    setState("IDLE")
    setErrorMessage(null)
  }

  if (state === "GPS_DENIED") {
    return <GPSPermissionBanner onRetry={handleRetry} />
  }

  if (state === "OUTSIDE_RADIUS") {
    return (
      <div className="space-y-3">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTitle>Outside Work Location</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <Button
          onClick={handleRetry}
          className="w-full max-w-md mx-auto block"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (state === "ALREADY_CHECKED_IN") {
    return (
      <Alert variant="warning" className="max-w-md mx-auto">
        <AlertTitle>Already Checked In</AlertTitle>
        <AlertDescription>
          You have already checked in today. Check your dashboard for details.
        </AlertDescription>
      </Alert>
    )
  }

  const isLoading = state === "GETTING_LOCATION" || state === "VALIDATING" || isGettingLocation

  return (
    <Button
      onClick={handleCheckIn}
      disabled={isLoading || alreadyCheckedIn}
      size="lg"
      className="w-full max-w-md mx-auto bg-green-600 hover:bg-green-700 disabled:bg-green-400"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          {state === "GETTING_LOCATION" ? "Getting your location..." : "Validating location..."}
        </>
      ) : (
        <>
          <MapPin className="w-5 h-5 mr-2" />
          Check In
        </>
      )}
    </Button>
  )
}

function Alert({ children, variant, className }: {
  children: React.ReactNode
  variant: "destructive" | "warning"
  className?: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${
      variant === "destructive" 
        ? "bg-red-50 border-red-200 text-red-800" 
        : "bg-amber-50 border-amber-200 text-amber-800"
    } ${className || ""}`}>
      {children}
    </div>
  )
}

function AlertTitle({ children, className }: {
  children: React.ReactNode
  className?: string
}) {
  return <h5 className={`font-semibold ${className || ""}`}>{children}</h5>
}

function AlertDescription({ children }: {
  children: React.ReactNode
}) {
  return <p className="text-sm mt-1">{children}</p>
}
