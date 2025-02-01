import { Clock, ShieldCheck, RefreshCw, DollarSign, Award, HeadphonesIcon } from 'lucide-react'

const reasons = [
  {
    title: "Save Time",
    description: "Get instant compliance insights instead of spending weeks on research, allowing you to focus on your core business.",
    icon: Clock
  },
  {
    title: "Reduce Risk",
    description: "Ensure your projects meet all local, state, and federal regulatory requirements, minimizing the chance of costly violations.",
    icon: ShieldCheck
  },
  {
    title: "Stay Updated",
    description: "Access the latest regulatory changes affecting your projects with real-time updates and notifications.",
    icon: RefreshCw
  },
  {
    title: "Cost-Effective",
    description: "Eliminate the need for expensive legal consultations and reduce the risk of fines with our affordable compliance solution.",
    icon: DollarSign
  },
  {
    title: "Industry Expertise",
    description: "Benefit from our team's deep understanding of regulatory landscapes across various industries and jurisdictions.",
    icon: Award
  },
  {
    title: "Dedicated Support",
    description: "Get assistance from our expert support team whenever you need help or have questions about compliance issues.",
    icon: HeadphonesIcon
  }
]

export default function WhyChooseUs() {
  return (
    <section id="why-choose-us" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose GovGoose</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <reason.icon className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{reason.title}</h3>
              <p className="text-gray-600">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

