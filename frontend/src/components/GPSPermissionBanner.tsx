import { MapPinOff, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface GPSPermissionBannerProps {
  onRetry: () => void
}

export function GPSPermissionBanner({ onRetry }: GPSPermissionBannerProps) {
  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes("chrome")) {
      return (
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Click the lock icon in the address bar</li>
          <li>Click &quot;Site Settings&quot; → &quot;Location&quot;</li>
          <li>Select &quot;Allow&quot;</li>
          <li>Refresh this page</li>
        </ul>
      )
    }
    
    if (userAgent.includes("firefox")) {
      return (
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Click the shield icon in the address bar</li>
          <li>Click &quot;Permissions&quot; → &quot;Access Your Location&quot;</li>
          <li>Select &quot;Allow&quot;</li>
          <li>Refresh this page</li>
        </ul>
      )
    }
    
    if (userAgent.includes("safari")) {
      return (
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Click Safari → Preferences → Privacy</li>
          <li>Click &quot;Location Services&quot;</li>
          <li>Enable location for this website</li>
          <li>Refresh this page</li>
        </ul>
      )
    }
    
    return (
      <ul className="list-disc list-inside space-y-1 mt-2">
        <li>Open your browser settings</li>
        <li>Find &quot;Location&quot; or &quot;Geolocation&quot; settings</li>
        <li>Enable location access for this website</li>
        <li>Refresh this page</li>
      </ul>
    )
  }

  return (
    <Alert variant="destructive" className="max-w-md mx-auto">
      <MapPinOff className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Location Access Required</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          WorkSight requires your location to verify you are at your assigned
          workplace before checking in.
        </p>
        <p className="font-medium text-sm mb-2">How to enable location:</p>
        {getBrowserInstructions()}
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-4 w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  )
}
