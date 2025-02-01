import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <div className="bg-gradient-to-r from-primary to-primary-light text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Streamline Your Compliance With GovGoose
          </h1>
          <p className="text-xl md:text-2xl mb-8 leading-relaxed">
            Get instant, accurate insights into legal, permit, and zoning requirements for your signage and construction projects. Save time, reduce risk, and stay compliant with ease.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              Start Your Project <ArrowRight className="ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Schedule a Demo
            </Button>
          </div>
        </div>
        <div className="md:w-1/2">
          <img src="/placeholder.svg?height=400&width=600" alt="GovGoose Dashboard" className="rounded-lg shadow-2xl" />
        </div>
      </div>
    </div>
  )
}

