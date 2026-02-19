import { useState, useCallback } from "react"

export interface Coords {
  latitude: number
  longitude: number
}

export interface UseGPSReturn {
  getLocation: () => Promise<Coords>
  isLoading: boolean
  error: string | null
  coords: Coords | null
}

export function useGPS(): UseGPSReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coords | null>(null)

  const getLocation = useCallback(async (): Promise<Coords> => {
    setIsLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setIsLoading(false)
        const err = "Location not available on this device"
        setError(err)
        reject(new Error(err))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setCoords(newCoords)
          setIsLoading(false)
          resolve(newCoords)
        },
        (err) => {
          setIsLoading(false)
          let errorMessage: string

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "Location access denied"
              break
            case err.TIMEOUT:
              errorMessage = "Location request timed out"
              break
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location not available on this device"
              break
            default:
              errorMessage = "Unable to get location"
          }

          setError(errorMessage)
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  return {
    getLocation,
    isLoading,
    error,
    coords,
  }
}
