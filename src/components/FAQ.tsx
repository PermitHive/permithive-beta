import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "How accurate are GovGoose's compliance reports?",
    answer: "GovGoose's compliance reports are highly accurate, thanks to our continuously updated database of regulations and advanced AI analysis. However, we always recommend consulting with legal professionals for final decisions."
  },
  {
    question: "How often is the regulatory database updated?",
    answer: "Our regulatory database is updated in real-time as new regulations are published or existing ones are modified. This ensures that you always have access to the most current compliance information."
  },
  {
    question: "Can GovGoose handle international projects?",
    answer: "Yes, GovGoose supports compliance checks for projects in multiple countries. Our database includes regulations from various international jurisdictions, making it ideal for businesses operating globally."
  },
  {
    question: "Is my project data secure with GovGoose?",
    answer: "Absolutely. We take data security very seriously. All data is encrypted in transit and at rest, and we comply with industry-standard security protocols to ensure your sensitive information is protected."
  },
  {
    question: "How long does it take to get a compliance report?",
    answer: "In most cases, you'll receive your compliance report within minutes of submitting your project details. For more complex projects or those in multiple jurisdictions, it may take up to an hour."
  }
]

export default function FAQ() {
  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

