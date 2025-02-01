import { Button } from '@/components/ui/button'

export default function CallToAction() {
  return (
    <section className="bg-primary text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Streamline Your Compliance Process?</h2>
        <p className="text-xl mb-8">
          Join thousands of businesses that trust GovGoose for their regulatory compliance needs. Start your journey to effortless compliance today!
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button size="lg" variant="secondary">
            Start Your Free Trial
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </section>
  )
}

