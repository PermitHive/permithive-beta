import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

export default function Footer() {
  const isLiveSupport = () => {
    const now = new Date()
    const ptOptions = { timeZone: 'America/Los_Angeles' }
    const ptTime = new Date(now.toLocaleString('en-US', ptOptions))
    const day = ptTime.getDay() // 0 is Sunday, 6 is Saturday
    const hour = ptTime.getHours()
    
    return day >= 1 && day <= 6 && // Monday to Saturday
           hour >= 6 && hour < 17 // 6am to 5pm PT
  }

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Column 1 - Live Support */}
          <div className="bg-gradient-to-b from-gray-800/80 to-gray-800/40 rounded-lg p-6 shadow-lg border border-gray-700/50 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
            <div className="relative">
              <h4 className="text-lg font-semibold mb-2 text-white">Live Support</h4>
              <div className="mb-6">
                <div className="relative inline-flex items-center px-2.5 py-1 rounded-full bg-green-900/50 text-green-400 shadow-[0_0_12px_0px_rgba(74,222,128,0.3)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_2px_rgba(74,222,128,0.6)]" />
                  <span className="ml-2 text-xs font-medium">
                    Available Now • Typical Response &lt;30min
                  </span>
                </div>
              </div>
              <div className="flex space-x-6">
                <a href="tel:312-550-4263" className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors">
                  <Phone className="w-5 h-5 text-green-400" />
                  <span>312-550-4263</span>
                </a>
                <a href="mailto:founders@govgoose.com" className="flex items-center space-x-2 text-gray-200 hover:text-white transition-colors">
                  <Mail className="w-5 h-5 text-green-400" />
                  <span>founders@govgoose.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 - Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/projects" className="text-gray-400 hover:text-white transition-colors">My Projects</Link></li>
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors">Run a Code Check</Link></li>
              <li>
                <a 
                  href="mailto:founders@govgoose.com" 
                  className="inline-flex items-center px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white transition-colors"
                >
                  Support & Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} GovGoose. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

