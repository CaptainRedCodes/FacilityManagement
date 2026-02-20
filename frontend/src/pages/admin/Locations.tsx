import { useState, useEffect } from "react"
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, MapPin, Navigation, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { locationApi, Location } from "@/api/admin"
import { DashboardLayout } from "@/components/layout"
import { toast } from "sonner"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

function MapEventsHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapCenterSetter({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, 15)
    }
  }, [center, map])
  return null
}

interface LocationPickerProps {
  latitude: string
  longitude: string
  onChange: (lat: string, lng: string) => void
}

function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null)
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)

  useEffect(() => {
    if (latitude && longitude) {
      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng])
        setMarkerPosition([lat, lng])
      }
    }
  }, [latitude, longitude])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        onChange(lat.toString(), lng.toString())
        setMapCenter([lat, lng])
        setMarkerPosition([lat, lng])
        setIsGettingLocation(false)
        toast.success("Location captured from GPS")
      },
      (error) => {
        setIsGettingLocation(false)
        toast.error("Failed to get location: " + error.message)
      }
    )
  }

  const handleMapClick = (lat: number, lng: number) => {
    onChange(lat.toString(), lng.toString())
    setMarkerPosition([lat, lng])
  }

  const defaultCenter: [number, number] = mapCenter || [20.5937, 78.9629]
  const markerPos = markerPosition || mapCenter

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={isGettingLocation}
          className="flex-1"
        >
          {isGettingLocation ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Use My Location
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden" style={{ height: "250px" }}>
        <MapContainer
          center={defaultCenter}
          zoom={mapCenter ? 15 : 5}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsHandler onLocationSelect={handleMapClick} />
          <MapCenterSetter center={mapCenter} />
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>
      </div>
      
      <p className="text-xs text-slate-500 text-center">
        Click on the map to set location or use "Use My Location" button
      </p>
    </div>
  )
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    latitude: "",
    longitude: "",
    allowed_radius_meters: 150,
  })

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      setIsLoading(true)
      const data = await locationApi.getAll()
      setLocations(data)
    } catch (err) {
      setError("Failed to load locations")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        allowed_radius_meters: formData.allowed_radius_meters,
      }

      if (editingLocation) {
        await locationApi.update(editingLocation.id, payload)
        toast.success("Location updated successfully")
      } else {
        await locationApi.create(payload)
        toast.success("Location created successfully")
      }
      await fetchLocations()
      closeModal()
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } }
        setError(axiosError.response?.data?.detail || "An error occurred")
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      latitude: location.latitude?.toString() || "",
      longitude: location.longitude?.toString() || "",
      allowed_radius_meters: location.allowed_radius_meters,
    })
    setIsModalOpen(true)
    setShowMapPicker(!!location.latitude && !!location.longitude)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return

    try {
      await locationApi.delete(id)
      toast.success("Location deleted successfully")
      await fetchLocations()
    } catch (err) {
      toast.error("Failed to delete location")
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingLocation(null)
    setFormData({
      name: "",
      address: "",
      city: "",
      latitude: "",
      longitude: "",
      allowed_radius_meters: 150,
    })
    setError(null)
    setShowMapPicker(false)
  }

  const activeLocations = locations.filter(l => l.is_active)

  return (
    <DashboardLayout
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Locations" },
      ]}
      actions={
        <Button onClick={() => setIsModalOpen(true)} className="bg-black hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground">Manage your workplace locations and GPS settings</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
          </div>
        ) : locations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No locations yet</h3>
              <p className="text-slate-600 text-center mb-4 max-w-md">
                Add your first workplace location to start tracking employee attendance
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-black hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Location
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeLocations.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Locations ({activeLocations.length})</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeLocations.map((location) => (
                    <Card key={location.id} className="hover:shadow-md transition-shadow border-l-4 border-l-black">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-black" />
                            </div>
                            <CardTitle className="text-base">{location.name}</CardTitle>
                          </div>
                          <Badge variant="success" className="bg-gray-100 text-black border-gray-200 text-xs">Active</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm">
                          {location.address && (
                            <p className="text-slate-600 flex items-start gap-2">
                              <Building2 className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                              {location.address}
                              {location.city && `, ${location.city}`}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Employee check-in radius
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              {location.allowed_radius_meters}m
                            </span>
                          </div>
                          {location.latitude && location.longitude && (
                            <div className="flex items-center gap-1 text-xs text-black">
                              <Navigation className="w-3 h-3" />
                              GPS coordinates set
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-4 pt-3 border-t">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(location)} className="h-8">
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(location.id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingLocation ? "Edit Location" : "Add Location"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                    placeholder="e.g., Main Office"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="123 Business Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="New York"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Location Coordinates</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="w-full"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {showMapPicker ? "Hide Map Picker" : "Pick from Map"}
                  </Button>
                  
                  {showMapPicker && (
                    <LocationPicker
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                    />
                  )}
                </div>

                {!showMapPicker && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="e.g., 12.9716"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="e.g., 77.5946"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="radius">Allowed Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={formData.allowed_radius_meters}
                    onChange={(e) => setFormData({ ...formData, allowed_radius_meters: parseInt(e.target.value) || 150 })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-slate-500">Employees must be within this radius to check in</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1" disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-black hover:bg-gray-800" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {editingLocation ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
