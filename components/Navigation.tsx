import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { useUIStore } from '@/stores/uiStore'

export default function Navigation() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { mobileMenuOpen, setMobileMenuOpen, toggleMobileMenu } = useUIStore()

  if (!user) return null

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/patients', label: 'Patients' },
    { href: '/visits', label: 'Visits' },
    { href: '/invoices', label: 'Invoices' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard'
    }
    return router.pathname === href || router.pathname.startsWith(href)
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                One Rehab
              </Link>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:ml-6 md:flex md:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(link.href)
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="px-3 mb-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logout()
                  }}
                  className="w-full justify-start"
                >
                  Logout
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}