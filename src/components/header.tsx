'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FolderKanban, Book, Settings, LogOut, LayoutDashboard, Bird, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Catalog', href: '/catalog', icon: Book },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface NavbarProps {
  onLogout: () => void;
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    checkUser()
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const AuthButton = () => (
    <Button
      variant="ghost"
      className={`ml-4 ${
        isScrolled 
          ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          : 'text-gray-900 hover:bg-white/10 hover:text-gray-900'
      }`}
      onClick={isAuthenticated ? handleLogout : () => router.push('/login')}
    >
      {isAuthenticated ? (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </>
      ) : (
        <>
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Login
        </>
      )}
    </Button>
  )

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        isScrolled 
          ? 'bg-background border-b border-gray-200' 
          : 'bg-transparent border-b border-gray-200/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <div className={`transition-all duration-200 ${
                  isScrolled 
                    ? '[&>img]:brightness-0 [&>img]:hue-rotate-[75deg]' 
                    : '[&>img]:brightness-0'
                }`}>
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={180}
                    height={180}
                  />
                </div>
              </Link>
            </div>
            <div className="hidden sm:flex sm:items-center sm:ml-6">
              <div className="flex items-center space-x-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : isScrolled
                          ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          : 'text-gray-900 hover:text-gray-900 hover:bg-white/10'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
              <AuthButton />
            </div>
            <div className="sm:hidden">
              <Button
                variant="ghost"
                onClick={toggleMenu}
                className={isScrolled ? 'text-muted-foreground' : 'text-gray-900'}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <div 
          className={`sm:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          <div className={`px-2 pt-2 pb-3 space-y-1 ${
            isScrolled ? 'bg-background' : 'bg-white/90'
          }`}>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isScrolled
                      ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      : 'text-gray-900 hover:text-gray-900 hover:bg-white/10'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              )
            })}
            <Button
              variant="ghost"
              className={`w-full justify-start ${
                isScrolled
                  ? 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  : 'text-gray-900 hover:text-gray-900 hover:bg-white/10'
              }`}
              onClick={isAuthenticated ? handleLogout : () => router.push('/login')}
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="w-5 h-5 mr-2" />
                  Logout
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Login
                </>
              )}
            </Button>
          </div>
        </div>
      </nav>
      <div className="h-16" />
    </>
  )
}

