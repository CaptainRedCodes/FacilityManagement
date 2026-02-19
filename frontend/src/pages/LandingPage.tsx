import { Building2, Users, Calendar, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">WorkSight</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">About</a>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 animate-fade-in-up">
              Intelligent Workforce & <span className="text-indigo-600">Facility Management</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto animate-fade-in-up">
              Streamline your operations with AI-powered insights. WorkSight combines workforce scheduling, 
              facility management, and real-time analytics in one intuitive platform.
            </p>

            <div className="flex justify-center gap-4 animate-fade-in-up">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Features Section */}
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
                <Card key={index} className="border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 mx-auto">
                      <feature.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 px-4 bg-slate-50">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">About WorkSight</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              WorkSight transforms how organizations manage their most valuable resources — people and facilities. 
              Our platform combines AI technology with intuitive design to deliver actionable insights.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Whether managing a small team or a large enterprise, WorkSight scales to meet your needs.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">WorkSight</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} WorkSight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
