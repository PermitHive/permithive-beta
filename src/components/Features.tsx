import { Shield, Zap, RefreshCw, Globe, FileText, Users } from 'lucide-react'

const features = [
  {
    title: "Comprehensive Compliance Checks",
    description: "Our AI analyzes your projects against local, state, and federal regulations to ensure full compliance.",
    icon: Shield
  },
  {
    title: "Real-Time Updates",
    description: "Stay informed with instant notifications about regulatory changes affecting your projects.",
    icon: RefreshCw
  },
  {
    title: "Multi-Jurisdiction Support",
    description: "Seamlessly manage projects across different cities, states, and countries with our global database.",
    icon: Globe
  },
  {
    title: "Customized Reports",
    description: "Receive detailed, easy-to-understand compliance reports tailored to your specific project needs.",
    icon: FileText
  },
  {
    title: "Collaboration Tools",
    description: "Share reports and insights with team members, clients, or regulatory bodies directly through our platform.",
    icon: Users
  },
  {
    title: "Lightning-Fast Results",
    description: "Get compliance insights in minutes, not weeks, allowing you to move your projects forward quickly.",
    icon: Zap
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features to Ensure Compliance</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <feature.icon className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

