import { Building2, Truck, Store, Hammer, Factory, Home } from 'lucide-react'

const industries = [
  { name: "Commercial Real Estate", icon: Building2 },
  { name: "Transportation & Logistics", icon: Truck },
  { name: "Retail & Hospitality", icon: Store },
  { name: "Construction & Development", icon: Hammer },
  { name: "Manufacturing", icon: Factory },
  { name: "Residential Real Estate", icon: Home },
]

export default function Industries() {
  return (
    <section id="industries" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Industries We Serve</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {industries.map((industry, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className="bg-primary-light rounded-full p-4 mb-4">
                <industry.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">{industry.name}</h3>
            </div>
          ))}
        </div>
        <p className="text-center mt-12 text-gray-600">
          Don't see your industry? Contact us to learn how GovGoose can be tailored to your specific needs.
        </p>
      </div>
    </section>
  )
}

