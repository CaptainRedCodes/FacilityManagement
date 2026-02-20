import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Building2, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    department: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          location: formData.location || null,
          department: formData.department || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || "Registration failed")
      }

      const data = await response.json()
      localStorage.setItem("token", data.access_token)
      localStorage.setItem("user", JSON.stringify(data.user))
      setSuccess(true)
      setTimeout(() => {
        navigate("/dashboard")
      }, 1500)
    } catch (err: unknown) {
      if (err && typeof err === "object" && "message" in err) {
        setError(err.message as string)
      } else {
        setError("An error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-sm bg-white border-gray-200 shadow-sm">
          <CardContent className="pt-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Registration Successful!</h2>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="space-y-4 text-center px-6 pt-8 pb-0">
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Create Account</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Join WorkSight</p>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-8 pt-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-9 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-9 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-9 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  className="h-9 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">Location (optional)</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="Your location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isLoading}
                  className="h-9 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">Department (optional)</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Your department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={isLoading}
                  className="h-9 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              {error && (
                <div className="p-2.5 rounded-md bg-red-50 text-red-600 border border-red-100 text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full h-9 bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
              <p className="text-center text-xs text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="text-gray-900 hover:underline font-medium cursor-pointer">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
