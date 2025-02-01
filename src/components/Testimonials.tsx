import { Star } from 'lucide-react'

const testimonials = [
  {
    name: "John Smith",
    role: "Project Manager, ABC Construction",
    content: "GovGoose has revolutionized our compliance process. We've cut our research time by 75% and haven't missed a single regulatory requirement since we started using it.",
    rating: 5
  },
  {
    name: "Sarah Johnson",
    role: "CEO, XYZ Retail Group",
    content: "Expanding our business across multiple states was a compliance nightmare until we found GovGoose. Now, we can confidently enter new markets knowing we're fully compliant.",
    rating: 5
  },
  {
    name: "Michael Lee",
    role: "Legal Counsel, 123 Real Estate",
    content: "As a legal professional, I'm impressed by the accuracy and comprehensiveness of GovGoose's compliance reports. It's become an indispensable tool in our risk management strategy.",
    rating: 5
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Clients Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>))}
        </div>
      </div>
    </section>
  )
}

