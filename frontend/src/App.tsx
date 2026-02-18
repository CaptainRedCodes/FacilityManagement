import { Building2, Users, Calendar, Shield, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const features = [
    {
      icon: Users,
      title: 'Workforce Management',
      description: 'Track employee schedules, attendance, and performance metrics in one unified dashboard.',
    },
    {
      icon: Building2,
      title: 'Facility Tracking',
      description: 'Monitor assets, equipment maintenance, and facility utilization with real-time insights.',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling with AI',
      description: 'AI-powered scheduling that optimizes resource allocation and reduces conflicts.',
    },
    {
      icon: Shield,
      title: 'Security & Compliance',
      description: 'Ensure workplace safety with automated compliance checks and access controls.',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/api/v1/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name: name || undefined }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to join waitlist')
      }

      setMessage({ type: 'success', text: "You're on the list! We'll be in touch soon." })
      setEmail('')
      setName('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">WorkSight</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-teal-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-teal-600 transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse-soft"></span>
              Coming Soon
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 animate-fade-in-up">
              Intelligent Workforce &
              <span className="text-teal-600"> Facility Management</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Streamline your operations with AI-powered insights. WorkSight brings together 
              workforce scheduling, facility management, and real-time analytics in one platform.
            </p>

            <Card className="max-w-md mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">Name (optional)</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">Email address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        Get Early Access
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
                
                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {message.text}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Be the first to know when we launch. No spam, ever.
                </p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-8 text-sm text-slate-500 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                <span>Early Bird Access</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                <span>Priority Support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
                <span>Exclusive Pricing</span>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-12" />

        <section id="features" className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Everything you need to manage your workplace
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Powerful features designed to simplify complex operations and boost productivity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-slate-200 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                About WorkSight
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                WorkSight is designed to transform how organizations manage their most valuable 
                resources — people and facilities. Our platform combines cutting-edge AI technology 
                with intuitive design to deliver actionable insights that drive efficiency, reduce 
                costs, and improve employee satisfaction.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                Whether you're managing a small team or a large enterprise, WorkSight scales to 
                meet your needs. Join hundreds of organizations already on our waitlist.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">WorkSight</span>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} WorkSight. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
