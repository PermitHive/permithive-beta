import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: "Starter",
    price: 99,
    features: [
      "Up to 5 projects per month",
      "Basic compliance reports",
      "Email support",
      "7-day data retention"
    ]
  },
  {
    name: "Professional",
    price: 299,
    features: [
      "Up to 20 projects per month",
      "Advanced compliance reports",
      "Priority email support",
      "30-day data retention",
      "API access"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Unlimited projects",
      "Custom compliance solutions",
      "24/7 phone and email support",
      "Unlimited data retention",
      "Dedicated account manager",
      "On-premise deployment options"
    ]
  }
]

export default function PricingPlans() {
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-md flex flex-col">
              <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">
                {typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                {typeof plan.price === 'number' && <span className="text-base font-normal">/month</span>}
              </div>
              <ul className="mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center mb-2">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant={index === 1 ? "default" : "outline"} className="w-full">
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

