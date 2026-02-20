import { Building2, Users, Calendar, Shield, ArrowRight, CheckCircle2, Zap, BarChart3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
      title: 'Smart Scheduling',
      description: 'AI-powered scheduling that optimizes resource allocation and reduces conflicts.',
    },
    {
      icon: Shield,
      title: 'Security & Compliance',
      description: 'Ensure workplace safety with automated compliance checks and access controls.',
    },
  ]

  const stats = [
    { value: '500+', label: 'Companies', icon: Building2 },
    { value: '50K+', label: 'Employees', icon: Users },
    { value: '99.9%', label: 'Uptime', icon: Zap },
    { value: '24/7', label: 'Support', icon: Clock },
  ]

  const benefits = [
    'Real-time attendance tracking',
    'GPS-based check-in verification',
    'Automated scheduling algorithms',
    'Comprehensive reporting & analytics',
    'Role-based access control',
    'Seamless integrations',
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-gray-900">WorkSight</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-gray-900 transition-colors cursor-pointer">
              Features
            </a>
            <a href="#benefits" className="hover:text-gray-900 transition-colors cursor-pointer">
              Benefits
            </a>
            <a href="#stats" className="hover:text-gray-900 transition-colors cursor-pointer">
              Stats
            </a>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer px-5 h-9 text-sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer px-5 h-9 text-sm">
                  Sign In
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="py-24 md:py-32 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600 mb-6">
              <Zap className="w-3 h-3" />
              Trusted by 500+ companies worldwide
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight leading-tight mb-6">
              Intelligent Workforce &{' '}
              <span className="text-gray-500">Facility Management</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
              Streamline your operations with AI-powered insights. WorkSight combines workforce
              scheduling, facility management, and analytics in one platform.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button className="h-10 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer">
                    Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button className="h-10 px-6 bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer">
                    Get Started <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
                Features
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" className="py-16 px-6 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <stat.icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Everything you need
              </h2>
              <p className="text-gray-500">
                Powerful features designed to simplify complex operations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <Card 
                  key={index} 
                  className="border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="pt-6">
                    <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center mb-4 group-hover:bg-gray-900 transition-colors">
                      <feature.icon className="w-4.5 h-4.5 text-gray-700" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1.5">{feature.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Why choose WorkSight?
                </h2>
                <p className="text-gray-500 mb-6">
                  We help organizations streamline their operations with powerful yet simple tools.
                </p>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl -z-10" />
                <Card className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Analytics Dashboard</p>
                        <p className="text-xs text-gray-500">Real-time insights</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-900 rounded-full" style={{ width: '85%' }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>85% attendance rate</span>
                        <span>+12% vs last month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to transform your workforce management?
            </h2>
            <p className="text-gray-500 mb-8">
              Join thousands of companies using WorkSight to streamline their operations.
            </p>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="h-11 px-8 bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link to="/register">
                <Button className="h-11 px-8 bg-gray-900 hover:bg-gray-800 text-white font-medium cursor-pointer">
                  Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16 px-6 border-t border-gray-100">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About WorkSight
            </h2>
            <p className="text-gray-500 leading-relaxed mb-2">
              WorkSight transforms how organizations manage their most valuable resources —
              people and facilities. Our platform combines technology with intuitive design
              to deliver actionable insights.
            </p>
            <p className="text-gray-500 leading-relaxed">
              Whether managing a small team or a large enterprise, WorkSight scales to meet
              your needs.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">WorkSight</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} WorkSight. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
