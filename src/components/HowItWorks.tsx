import { Upload, Zap, FileText, CheckCircle } from 'lucide-react'

const steps = [
  {
    title: "Upload Your Plans",
    description: "Simply upload your project details, including location information and specific requirements.",
    icon: Upload
  },
  {
    title: "AI-Powered Analysis",
    description: "Our advanced AI instantly processes your submission against our comprehensive regulatory database.",
    icon: Zap
  },
  {
    title: "Receive Detailed Reports",
    description: "Get comprehensive compliance reports with actionable insights and recommendations.",
    icon: FileText
  },
  {
    title: "Implement and Succeed",
    description: "Use our insights to ensure your project meets all regulatory requirements and proceed with confidence.",
    icon: CheckCircle
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">How GovGoose Works</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center">
                {index + 1}
              </div>
              <step.icon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

